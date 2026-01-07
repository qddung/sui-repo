/**
 * Main indexer that processes Sui checkpoints
 */

import { SuiClient } from '@mysten/sui/client';
import { RoomProcessor } from '../processors/room-processor';
import { MetadataProcessor } from '../processors/metadata-processor';
import { DatabaseService } from '../services/database';
import { ProcessedValue } from '../types';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export class SuiMeetIndexer {
  private client: SuiClient;
  private roomProcessor: RoomProcessor;
  private metadataProcessor: MetadataProcessor;
  private database: DatabaseService;
  private packageId: string;
  private checkpointBufferSize: number;
  private ingestConcurrency: number;
  private retryIntervalMs: number;
  private firstCheckpoint: bigint | null;
  private lastCheckpoint: bigint | null;
  private running: boolean = false;

  constructor(config: {
    rpcUrl: string;
    packageId: string;
    databaseUrl: string;
    checkpointBufferSize: number;
    ingestConcurrency: number;
    retryIntervalMs: number;
    firstCheckpoint?: bigint | null;
    lastCheckpoint?: bigint | null;
  }) {
    this.client = new SuiClient({ url: config.rpcUrl });
    this.packageId = config.packageId;
    this.roomProcessor = new RoomProcessor(config.packageId);
    this.metadataProcessor = new MetadataProcessor(config.packageId);
    this.database = new DatabaseService(config.databaseUrl);
    this.checkpointBufferSize = config.checkpointBufferSize;
    this.ingestConcurrency = config.ingestConcurrency;
    this.retryIntervalMs = config.retryIntervalMs;
    this.firstCheckpoint = config.firstCheckpoint || null;
    this.lastCheckpoint = config.lastCheckpoint || null;
  }

  /**
   * Start the indexer
   */
  async start(): Promise<void> {
    this.running = true;
    logger.info('Starting SuiMeet Indexer...');

    try {
      // Get latest checkpoint from database or start from first checkpoint
      let currentCheckpoint = await this.database.getLatestCheckpoint();
      if (this.firstCheckpoint !== null && this.firstCheckpoint > currentCheckpoint) {
        currentCheckpoint = this.firstCheckpoint - 1n; // Start from the checkpoint before first
      }

      logger.info(`Starting from checkpoint: ${currentCheckpoint}`);

      // Main indexing loop
      while (this.running) {
        try {
          // Get latest checkpoint from chain
          const latestCheckpointResponse = await this.client.getLatestCheckpointSequenceNumber();
          const latestCheckpoint = BigInt(latestCheckpointResponse);
          logger.info(`Latest checkpoint on chain: ${latestCheckpoint}`);

          // Check if we've reached the last checkpoint
          if (this.lastCheckpoint && currentCheckpoint >= this.lastCheckpoint) {
            logger.info(`Reached last checkpoint: ${this.lastCheckpoint}`);
            break;
          }

          // Process checkpoints in batches
          const endCheckpoint = this.lastCheckpoint
            ? this.lastCheckpoint < BigInt(latestCheckpoint)
              ? this.lastCheckpoint
              : BigInt(latestCheckpoint)
            : BigInt(latestCheckpoint);

          if (currentCheckpoint < endCheckpoint) {
            await this.processCheckpoints(currentCheckpoint + 1n, endCheckpoint);
            currentCheckpoint = endCheckpoint;
          } else {
            // Wait before checking again
            await this.sleep(this.retryIntervalMs);
          }
        } catch (error) {
          logger.error({ err: error }, 'Error in indexer loop');
          await this.sleep(this.retryIntervalMs);
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Fatal error in indexer');
      throw error;
    } finally {
      await this.database.close();
      logger.info('Indexer stopped');
    }
  }

  /**
   * Stop the indexer
   */
  stop(): void {
    this.running = false;
    logger.info('Stopping indexer...');
  }

  /**
   * Process checkpoints in a range
   */
  private async processCheckpoints(start: bigint, end: bigint): Promise<void> {
    const checkpointRange = Number(end - start);
    const batchSize = Math.min(this.checkpointBufferSize, checkpointRange);

    logger.info(`Processing checkpoints ${start} to ${end} (${checkpointRange} checkpoints)`);

    for (let i = 0; i < checkpointRange; i += batchSize) {
      const batchStart = start + BigInt(i);
      const batchEnd = BigInt(Math.min(Number(batchStart) + batchSize - 1, Number(end)));

      await this.processCheckpointBatch(batchStart, batchEnd);
    }
  }

  /**
   * Process a batch of checkpoints
   */
  private async processCheckpointBatch(start: bigint, end: bigint): Promise<void> {
    const checkpoints: bigint[] = [];
    for (let i = start; i <= end; i++) {
      checkpoints.push(i);
    }

    // Process checkpoints in parallel (with concurrency limit)
    const batches: bigint[][] = [];
    for (let i = 0; i < checkpoints.length; i += this.ingestConcurrency) {
      batches.push(checkpoints.slice(i, i + this.ingestConcurrency));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map((checkpoint) => this.processCheckpoint(checkpoint))
      );
    }
  }

  /**
   * Process a single checkpoint
   */
  private async processCheckpoint(checkpointSequenceNumber: bigint): Promise<void> {
    try {
      logger.debug(`Processing checkpoint ${checkpointSequenceNumber}`);

      // Get checkpoint data
      const checkpoint = await this.client.getCheckpoint({
        id: checkpointSequenceNumber.toString(),
      });

      if (!checkpoint.transactions || checkpoint.transactions.length === 0) {
        return;
      }

      // Get transaction digests - checkpoints contain transaction digests as strings
      const transactionDigests: string[] = [];
      for (const tx of checkpoint.transactions) {
        if (typeof tx === 'string') {
          transactionDigests.push(tx);
        } else if (tx && typeof tx === 'object') {
          // Handle different transaction reference formats
          const txObj = tx as any;
          if ('transaction' in txObj && typeof txObj.transaction === 'string') {
            transactionDigests.push(txObj.transaction);
          } else if ('digest' in txObj && typeof txObj.digest === 'string') {
            transactionDigests.push(txObj.digest);
          }
        }
      }

      if (transactionDigests.length === 0) {
        return;
      }

      // Process with room processor
      const roomValues = await this.roomProcessor.processCheckpoint(
        this.client,
        checkpointSequenceNumber,
        transactionDigests
      );

      // Process with metadata processor
      const metadataValues = await this.metadataProcessor.processCheckpoint(
        this.client,
        checkpointSequenceNumber,
        transactionDigests
      );

      // Combine and commit to database
      const allValues: ProcessedValue[] = [...roomValues, ...metadataValues];

      if (allValues.length > 0) {
        const affected = await this.database.commit(allValues);
        logger.info(
          `Checkpoint ${checkpointSequenceNumber}: Processed ${allValues.length} values, ${affected} database operations`
        );
      }
    } catch (error) {
      logger.error({ err: error }, `Error processing checkpoint ${checkpointSequenceNumber}`);
      // Don't throw - continue processing next checkpoint
    }
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

