/**
 * Metadata Processor - Handles MeetingMetadata dynamic fields
 */

import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import {
  ProcessedValue,
  MetadataUpsert,
  MetadataDelete,
  ObjectId,
} from '../types';
import { extractMeetingMetadata, u256ToDecimalString } from '../utils/parser';
import { extractObjectIdsFromTransaction } from '../utils/checkpoint';

export class MetadataProcessor {
  private packageId: string;
  private dynamicFieldType: string;

  constructor(packageId: string) {
    this.packageId = packageId;
    // DynamicField type: 0x2::dynamic_field::Field<vector<u8>, MeetingMetadata>
    this.dynamicFieldType = `0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field<vector<u8>, ${packageId}::sealmeet::MeetingMetadata>`;
  }

  /**
   * Process a checkpoint and extract metadata
   */
  async processCheckpoint(
    client: SuiClient,
    checkpointSequenceNumber: bigint,
    transactionDigests: string[]
  ): Promise<ProcessedValue[]> {
    const values: ProcessedValue[] = [];
    const processedRooms = new Set<ObjectId>();

    // Process all transactions in the checkpoint
    for (const digest of transactionDigests) {
      try {
        const tx = await client.getTransactionBlock({
          digest,
          options: {
            showInput: true,
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
        });

        // Extract object IDs from transaction
        const objectIds = extractObjectIdsFromTransaction(tx);

        // Fetch objects in parallel
        const objectPromises = objectIds.map((objectId) =>
          client.getObject({
            id: objectId,
            options: {
              showType: true,
              showContent: true,
              showOwner: true,
            },
          }).catch(() => null) // Return null if object fetch fails
        );

        const objectResponses = (await Promise.all(objectPromises)).filter(
          (obj: any) => obj !== null && obj.data !== null
        ) as any[];

        // Process metadata dynamic fields
        for (const objectResponse of objectResponses) {
          if (!objectResponse.data) continue;

          // Check if this is a dynamic field
          const objectType = objectResponse.data.type;
          if (objectType && objectType.includes('dynamic_field::Field')) {
            // Try to get the parent room ID from object owner
            // Dynamic fields are owned by their parent object
            const parentId = this.extractParentRoomId(objectResponse);
            if (parentId) {
              const metadata = extractMeetingMetadata(objectResponse, this.packageId, parentId);
              if (metadata) {
                values.push({
                  type: 'MetadataUpsert',
                  roomId: metadata.roomId.toString(),
                  dynamicFieldId: metadata.dynamicFieldId.toString(),
                  dfVersion: metadata.dfVersion,
                  language: metadata.language,
                  timezone: metadata.timezone,
                  recordingBlobId: metadata.recordingBlobId
                    ? u256ToDecimalString(metadata.recordingBlobId)
                    : undefined,
                } as MetadataUpsert);

                processedRooms.add(metadata.roomId);
              }
            }
          }
        }

        // Process MetadataUpdated events to detect deletions
        if (tx.events) {
          for (const event of tx.events) {
            if (event.type.includes('MetadataUpdated') && event.type.includes(this.packageId)) {
              // Parse event to get room_id
              // If we didn't find metadata for this room in the output objects,
              // it might have been deleted (handled by absence in next checkpoint)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${digest}:`, error);
      }
    }

    return values;
  }

  /**
   * Extract parent room ID from dynamic field object owner
   */
  private extractParentRoomId(objectResponse: any): ObjectId | null {
    if (!objectResponse.data?.owner) {
      return null;
    }

    const owner = objectResponse.data.owner;
    
    // Dynamic fields are owned by objects (ObjectOwner)
    // Owner can be: { ObjectOwner: "0x..." } or string address
    if (typeof owner === 'object') {
      if ('ObjectOwner' in owner) {
        return owner.ObjectOwner as ObjectId;
      }
      // Sometimes owner is directly an address string
      if ('address' in owner) {
        return owner.address as ObjectId;
      }
    }

    // If owner is a string, it might be the object ID
    if (typeof owner === 'string') {
      return owner as ObjectId;
    }

    return null;
  }
}

