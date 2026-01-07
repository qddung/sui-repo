/**
 * Database service for persisting indexed data
 */

import { PrismaClient } from '@prisma/client';
import {
  ProcessedValue,
  RoomUpsert,
  RoomDelete,
  ParticipantUpsert,
  ParticipantDelete,
  MetadataUpsert,
  MetadataDelete,
} from '../types';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor(databaseUrl: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  /**
   * Commit processed values to database
   */
  async commit(values: ProcessedValue[]): Promise<number> {
    let totalAffected = 0;

    // Separate by type
    const roomsToUpsert: RoomUpsert[] = [];
    const roomsToDelete: RoomDelete[] = [];
    const participantsToUpsert: ParticipantUpsert[] = [];
    const participantsToDelete: ParticipantDelete[] = [];
    const metadataToUpsert: MetadataUpsert[] = [];
    const metadataToDelete: MetadataDelete[] = [];

    for (const value of values) {
      switch (value.type) {
        case 'RoomUpsert':
          roomsToUpsert.push(value);
          break;
        case 'RoomDelete':
          roomsToDelete.push(value);
          break;
        case 'ParticipantUpsert':
          participantsToUpsert.push(value);
          break;
        case 'ParticipantDelete':
          participantsToDelete.push(value);
          break;
        case 'MetadataUpsert':
          metadataToUpsert.push(value);
          break;
        case 'MetadataDelete':
          metadataToDelete.push(value);
          break;
      }
    }

    // Delete rooms first (CASCADE will delete participants and metadata)
    if (roomsToDelete.length > 0) {
      const roomIds = roomsToDelete.map((r) => r.roomId);
      const deleted = await this.prisma.meetingRoom.deleteMany({
        where: {
          roomId: {
            in: roomIds,
          },
        },
      });
      totalAffected += deleted.count;
    }

    // Upsert rooms
    for (const room of roomsToUpsert) {
      const participantCount = room.participants.length;

      await this.prisma.meetingRoom.upsert({
        where: {
          roomId: room.roomId,
        },
        create: {
          roomId: room.roomId,
          title: room.title,
          hosts: room.hosts,
          sealPolicyId: room.sealPolicyId,
          status: room.status,
          maxParticipants: room.maxParticipants,
          requireApproval: room.requireApproval,
          participantCount,
          createdAt: room.createdAt,
          startedAt: room.startedAt,
          endedAt: room.endedAt,
          checkpointSequenceNumber: room.checkpointSequenceNumber,
          transactionDigest: room.transactionDigest,
        },
        update: {
          title: room.title,
          hosts: room.hosts,
          sealPolicyId: room.sealPolicyId,
          status: room.status,
          maxParticipants: room.maxParticipants,
          requireApproval: room.requireApproval,
          participantCount,
          startedAt: room.startedAt,
          endedAt: room.endedAt,
          checkpointSequenceNumber: room.checkpointSequenceNumber,
          transactionDigest: room.transactionDigest,
        },
      });
      totalAffected++;
    }

    // Delete participants
    for (const participant of participantsToDelete) {
      const deleted = await this.prisma.roomParticipant.deleteMany({
        where: {
          roomId: participant.roomId,
          participantAddress: participant.participantAddress,
        },
      });
      totalAffected += deleted.count;
    }

    // Upsert participants
    for (const participant of participantsToUpsert) {
      await this.prisma.roomParticipant.upsert({
        where: {
          roomId_participantAddress: {
            roomId: participant.roomId,
            participantAddress: participant.participantAddress,
          },
        },
        create: {
          roomId: participant.roomId,
          participantAddress: participant.participantAddress,
          role: participant.role,
          adminCapId: participant.adminCapId,
        },
        update: {
          role: participant.role,
          adminCapId: participant.adminCapId,
        },
      });
      totalAffected++;
    }

    // Delete metadata
    if (metadataToDelete.length > 0) {
      const roomIds = metadataToDelete.map((m) => m.roomId);
      const deleted = await this.prisma.roomMetadata.deleteMany({
        where: {
          roomId: {
            in: roomIds,
          },
        },
      });
      totalAffected += deleted.count;
    }

    // Upsert metadata
    for (const metadata of metadataToUpsert) {
      await this.prisma.roomMetadata.upsert({
        where: {
          roomId: metadata.roomId,
        },
        create: {
          roomId: metadata.roomId,
          dynamicFieldId: metadata.dynamicFieldId,
          dfVersion: metadata.dfVersion,
          language: metadata.language,
          timezone: metadata.timezone,
          recordingBlobId: metadata.recordingBlobId
            ? metadata.recordingBlobId
            : null,
        },
        update: {
          dynamicFieldId: metadata.dynamicFieldId,
          dfVersion: metadata.dfVersion,
          language: metadata.language,
          timezone: metadata.timezone,
          recordingBlobId: metadata.recordingBlobId
            ? metadata.recordingBlobId
            : null,
        },
      });
      totalAffected++;
    }

    return totalAffected;
  }

  /**
   * Get the latest checkpoint sequence number
   */
  async getLatestCheckpoint(): Promise<bigint> {
    const room = await this.prisma.meetingRoom.findFirst({
      orderBy: {
        checkpointSequenceNumber: 'desc',
      },
      select: {
        checkpointSequenceNumber: true,
      },
    });

    if (!room) {
      return 0n;
    }

    // Prisma returns BigInt as string for Decimal types, but our schema uses BigInt
    // Convert to bigint
    return BigInt(room.checkpointSequenceNumber.toString());
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

