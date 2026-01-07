/**
 * Configuration for the indexer
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Sui Configuration
  suiNetwork: process.env.SUI_NETWORK || 'testnet',
  suiRpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
  suimeetPackageId: process.env.SUIMEET_PACKAGE_ID || '',
  
  // Indexer Configuration
  checkpointBufferSize: parseInt(process.env.CHECKPOINT_BUFFER_SIZE || '5000', 10),
  ingestConcurrency: parseInt(process.env.INGEST_CONCURRENCY || '200', 10),
  retryIntervalMs: parseInt(process.env.RETRY_INTERVAL_MS || '200', 10),
  
  // Checkpoint Range (optional)
  firstCheckpoint: process.env.FIRST_CHECKPOINT ? BigInt(process.env.FIRST_CHECKPOINT) : null,
  lastCheckpoint: process.env.LAST_CHECKPOINT ? BigInt(process.env.LAST_CHECKPOINT) : null,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Validate required configuration
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!config.suimeetPackageId) {
  throw new Error('SUIMEET_PACKAGE_ID is required');
}

if (!config.suiRpcUrl) {
  throw new Error('SUI_RPC_URL is required');
}

