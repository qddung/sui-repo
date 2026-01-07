/**
 * Type definitions for the indexer
 */

export * from './events';

import { ObjectId, SuiAddress } from './events';

/**
 * Parsed MeetingRoom fields extracted from Move object
 */
export interface ParsedMeetingRoom {
  objectId: ObjectId;
  title: string;
  description?: string;
  hosts: SuiAddress[];
  participants: SuiAddress[];
  maxParticipants: bigint;
  requireApproval: boolean;
  sealPolicyId: ObjectId;
  status: number; // 1=scheduled, 2=active, 3=ended
  createdAt: bigint;
  startedAt: bigint;
  endedAt: bigint;
}

/**
 * Parsed HostCap fields extracted from Move object
 */
export interface ParsedHostCap {
  capId: ObjectId;
  roomId: ObjectId;
  grantedAt: bigint;
}

/**
 * Parsed MeetingMetadata fields extracted from dynamic field
 */
export interface ParsedMeetingMetadata {
  dynamicFieldId: ObjectId;
  dfVersion: bigint;
  roomId: ObjectId;
  language: string;
  timezone: string;
  recordingBlobId?: bigint; // u256
}

/**
 * Processed value for room upsert
 */
export interface RoomUpsert {
  type: 'RoomUpsert';
  roomId: string;
  title: string;
  hosts: string[];
  participants: string[];
  sealPolicyId: string;
  status: number;
  maxParticipants: bigint;
  requireApproval: boolean;
  createdAt: bigint;
  startedAt?: bigint;
  endedAt?: bigint;
  checkpointSequenceNumber: bigint;
  transactionDigest: string;
}

/**
 * Processed value for room delete
 */
export interface RoomDelete {
  type: 'RoomDelete';
  roomId: string;
}

/**
 * Processed value for participant upsert
 */
export interface ParticipantUpsert {
  type: 'ParticipantUpsert';
  roomId: string;
  participantAddress: string;
  role: 'HOST' | 'PARTICIPANT';
  adminCapId?: string;
}

/**
 * Processed value for participant delete
 */
export interface ParticipantDelete {
  type: 'ParticipantDelete';
  roomId: string;
  participantAddress: string;
}

/**
 * Processed value for metadata upsert
 */
export interface MetadataUpsert {
  type: 'MetadataUpsert';
  roomId: string;
  dynamicFieldId: string;
  dfVersion: bigint;
  language: string;
  timezone: string;
  recordingBlobId?: string; // Stored as Decimal string
}

/**
 * Processed value for metadata delete
 */
export interface MetadataDelete {
  type: 'MetadataDelete';
  roomId: string;
}

/**
 * Union type for all processed values
 */
export type ProcessedValue =
  | RoomUpsert
  | RoomDelete
  | ParticipantUpsert
  | ParticipantDelete
  | MetadataUpsert
  | MetadataDelete;

