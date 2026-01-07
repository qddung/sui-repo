/**
 * Main entry point for the SuiMeet Indexer
 */

import { config } from './config';
import { SuiMeetIndexer } from './indexer/indexer';
import pino from 'pino';

const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

async function main() {
  logger.info('Starting SuiMeet Indexer...');
  logger.info(`Package ID: ${config.suimeetPackageId}`);
  logger.info(`RPC URL: ${config.suiRpcUrl}`);
  logger.info(`Network: ${config.suiNetwork}`);

  // Create indexer instance
  const indexer = new SuiMeetIndexer({
    rpcUrl: config.suiRpcUrl,
    packageId: config.suimeetPackageId,
    databaseUrl: config.databaseUrl,
    checkpointBufferSize: config.checkpointBufferSize,
    ingestConcurrency: config.ingestConcurrency,
    retryIntervalMs: config.retryIntervalMs,
    firstCheckpoint: config.firstCheckpoint,
    lastCheckpoint: config.lastCheckpoint,
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    indexer.stop();
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    indexer.stop();
  });

  // Start indexing
  try {
    await indexer.start();
  } catch (error) {
    logger.error({ err: error }, 'Fatal error');
    process.exit(1);
  }
}

// Run the indexer
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

