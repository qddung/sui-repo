/**
 * Utility functions for parsing Move objects and events
 */

import { SuiObjectResponse } from '@mysten/sui/client';
import { ParsedMeetingRoom, ParsedHostCap, ParsedMeetingMetadata, ObjectId, SuiAddress } from '../types';

/**
 * Extract MeetingRoom fields from a Sui object
 */
export function extractMeetingRoom(
  object: SuiObjectResponse,
  packageId: string
): ParsedMeetingRoom | null {
  if (!object.data) {
    return null;
  }

  const data = object.data;
  
  // Check if this is a MeetingRoom type
  const type = data.type;
  if (!type || !type.includes(`${packageId}::sealmeet::MeetingRoom`)) {
    return null;
  }

  if (data.content?.dataType !== 'moveObject') {
    return null;
  }

  try {
    const fields = data.content.fields as any;
    
    // Parse fields from Move object
    return {
      objectId: data.objectId,
      title: fields.title || '',
      description: fields.description,
      hosts: (fields.hosts || []) as SuiAddress[],
      participants: (fields.participants || []) as SuiAddress[],
      maxParticipants: BigInt(fields.max_participants || 0),
      requireApproval: fields.require_approval || false,
      sealPolicyId: fields.seal_policy_id as ObjectId,
      status: parseInt(fields.status || '1'),
      createdAt: BigInt(fields.created_at || 0),
      startedAt: BigInt(fields.started_at || 0),
      endedAt: BigInt(fields.ended_at || 0),
    };
  } catch (error) {
    console.error('Failed to extract MeetingRoom:', error);
    return null;
  }
}

/**
 * Extract HostCap fields from a Sui object
 */
export function extractHostCap(
  object: SuiObjectResponse,
  packageId: string
): ParsedHostCap | null {
  if (!object.data) {
    return null;
  }

  const data = object.data;
  
  // Check if this is a HostCap type
  const type = data.type;
  if (!type || !type.includes(`${packageId}::sealmeet::HostCap`)) {
    return null;
  }

  if (data.content?.dataType !== 'moveObject') {
    return null;
  }

  try {
    const fields = data.content.fields as any;
    
    return {
      capId: data.objectId,
      roomId: fields.room_id as ObjectId,
      grantedAt: BigInt(fields.granted_at || 0),
    };
  } catch (error) {
    console.error('Failed to extract HostCap:', error);
    return null;
  }
}

/**
 * Extract MeetingMetadata from a dynamic field object
 */
export function extractMeetingMetadata(
  object: SuiObjectResponse,
  packageId: string,
  roomId: ObjectId
): ParsedMeetingMetadata | null {
  if (!object.data) {
    return null;
  }

  const data = object.data;
  
  // Check if this is a DynamicField with MeetingMetadata
  const type = data.type;
  if (!type || !type.includes('dynamic_field::Field')) {
    return null;
  }

  if (data.content?.dataType !== 'moveObject') {
    return null;
  }

  try {
    const fields = data.content.fields as any;
    
    // Dynamic field structure: { id, name, value }
    // value is MeetingMetadata
    const metadata = fields.value || fields;
    
    return {
      dynamicFieldId: data.objectId,
      dfVersion: BigInt(data.version || '0'),
      roomId,
      language: metadata.language || '',
      timezone: metadata.timezone || '',
      recordingBlobId: metadata.recording_blob_id 
        ? BigInt(metadata.recording_blob_id) 
        : undefined,
    };
  } catch (error) {
    console.error('Failed to extract MeetingMetadata:', error);
    return null;
  }
}

/**
 * Convert u256 (bigint) to Decimal string for PostgreSQL
 */
export function u256ToDecimalString(value: bigint): string {
  return value.toString();
}

/**
 * Convert Decimal string to u256 (bigint)
 */
export function decimalStringToU256(value: string): bigint {
  return BigInt(value);
}

/**
 * Convert Move string (Uint8Array) to JavaScript string
 */
export function moveStringToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert JavaScript string to Move string (Uint8Array)
 */
export function stringToMoveString(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

