/**
 * Room Processor - Handles MeetingRoom and participant tracking
 */

import { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import {
  ProcessedValue,
  RoomUpsert,
  RoomDelete,
  ParticipantUpsert,
  ParticipantDelete,
  ObjectId,
} from '../types';
import { extractMeetingRoom, extractHostCap } from '../utils/parser';
import { extractObjectIdsFromTransaction } from '../utils/checkpoint';

export class RoomProcessor {
  private packageId: string;
  private meetingRoomType: string;
  private hostCapType: string;

  constructor(packageId: string) {
    this.packageId = packageId;
    this.meetingRoomType = `${packageId}::sealmeet::MeetingRoom`;
    this.hostCapType = `${packageId}::sealmeet::HostCap`;
  }

  /**
   * Process a checkpoint and extract room data
   */
  async processCheckpoint(
    client: SuiClient,
    checkpointSequenceNumber: bigint,
    transactionDigests: string[]
  ): Promise<ProcessedValue[]> {
    const values: ProcessedValue[] = [];
    const hostCapMap = new Map<ObjectId, ObjectId>(); // room_id -> cap_id

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

        // Track HostCap objects
        for (const objectResponse of objectResponses) {
          if (!objectResponse.data) continue;
          
          const hostCap = extractHostCap(objectResponse, this.packageId);
          if (hostCap) {
            hostCapMap.set(hostCap.roomId, hostCap.capId);
          }
        }

        // Process MeetingRoom objects
        for (const objectResponse of objectResponses) {
          if (!objectResponse.data) continue;

          const room = extractMeetingRoom(objectResponse, this.packageId);
          if (room) {
            // Check if room was deleted (object doesn't exist)
            if (!objectResponse.data.content) {
              values.push({
                type: 'RoomDelete',
                roomId: room.objectId.toString(),
              } as RoomDelete);
              continue;
            }

            // Upsert room
            const hosts = room.hosts.map((h) => h.toString());
            const participants = room.participants.map((p) => p.toString());
            const hostSet = new Set(hosts);

            values.push({
              type: 'RoomUpsert',
              roomId: room.objectId.toString(),
              title: room.title,
              hosts,
              participants,
              sealPolicyId: room.sealPolicyId.toString(),
              status: room.status,
              maxParticipants: room.maxParticipants,
              requireApproval: room.requireApproval,
              createdAt: room.createdAt,
              startedAt: room.startedAt > 0n ? room.startedAt : undefined,
              endedAt: room.endedAt > 0n ? room.endedAt : undefined,
              checkpointSequenceNumber,
              transactionDigest: digest,
            } as RoomUpsert);

            // Add hosts as participants
            for (const host of hosts) {
              const adminCapId = hostCapMap.get(room.objectId);
              values.push({
                type: 'ParticipantUpsert',
                roomId: room.objectId.toString(),
                participantAddress: host,
                role: 'HOST',
                adminCapId: adminCapId?.toString(),
              } as ParticipantUpsert);
            }

            // Add non-host participants
            for (const participant of participants) {
              if (!hostSet.has(participant)) {
                values.push({
                  type: 'ParticipantUpsert',
                  roomId: room.objectId.toString(),
                  participantAddress: participant,
                  role: 'PARTICIPANT',
                } as ParticipantUpsert);
              }
            }
          }
        }

        // Process events
        if (tx.events) {
          for (const event of tx.events) {
            if (event.type.includes(this.packageId)) {
              // Handle GuestRevoked event
              if (event.type.includes('GuestRevoked')) {
                // Parse event data (simplified - would need proper BCS parsing)
                // For now, we'll rely on object state changes
              }
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
   * Extract objects from a transaction
   */
  private async extractObjectsFromTransaction(
    client: SuiClient,
    tx: SuiTransactionBlockResponse
  ): Promise<Map<ObjectId, any>> {
    const objects = new Map<ObjectId, any>();

    if (tx.objectChanges) {
      for (const change of tx.objectChanges) {
        let objectId: string | null = null;

        // Extract object ID from different change types
        if ('objectId' in change) {
          objectId = change.objectId;
        } else if ('objectType' in change && 'objectId' in change) {
          objectId = (change as any).objectId;
        }

        if (objectId) {
          try {
            const object = await client.getObject({
              id: objectId,
              options: {
                showType: true,
                showContent: true,
                showOwner: true,
              },
            });
            if (object.data) {
              objects.set(objectId, object);
            }
          } catch (error) {
            // Object might not exist anymore or be deleted
            // This is okay, we'll skip it
          }
        }
      }
    }

    // Also check balance changes for objects (some objects might be in balance changes)
    if (tx.balanceChanges) {
      for (const balanceChange of tx.balanceChanges) {
        if ('owner' in balanceChange && balanceChange.owner) {
          const owner = balanceChange.owner as any;
          if (owner.ObjectOwner) {
            const objectId = owner.ObjectOwner;
            if (!objects.has(objectId)) {
              try {
                const object = await client.getObject({
                  id: objectId,
                  options: {
                    showType: true,
                    showContent: true,
                    showOwner: true,
                  },
                });
                if (object.data) {
                  objects.set(objectId, object);
                }
              } catch (error) {
                // Skip if object doesn't exist
              }
            }
          }
        }
      }
    }

    return objects;
  }
}

