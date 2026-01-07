import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApproveGuestDto } from './dto/approve.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // Helper to convert room status code to string
  private getRoomStatus(statusCode: number): 'scheduled' | 'active' | 'ended' {
    switch (statusCode) {
      case 1:
        return 'scheduled';
      case 2:
        return 'active';
      case 3:
        return 'ended';
      default:
        return 'scheduled';
    }
  }

  // Helper to convert Unix timestamp to Date
  private unixToDate(timestamp: bigint | null): Date | null {
    if (!timestamp) return null;
    return new Date(Number(timestamp) * 1000);
  }

  async getAllRooms(walletAddress?: string, status?: string) {
    const where: any = {};

    if (walletAddress) {
      where.OR = [
        {
          hosts: {
            has: walletAddress,
          },
        },
        {
          participants: {
            some: {
              participantAddress: walletAddress,
            },
          },
        },
      ];
    }

    if (status) {
      const statusMap: Record<string, number> = {
        scheduled: 1,
        active: 2,
        ended: 3,
      };
      if (statusMap[status] !== undefined) {
        where.status = statusMap[status];
      }
    }

    const meetingRooms = await this.prisma.meetingRoom.findMany({
      where,
      include: {
        participants: true,
        metadata: true,
        approvals: {
          where: { status: 'pending' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return {
      rooms: meetingRooms.map((room) => {
        let userRole: 'HOST' | 'PARTICIPANT' | null = null;
        if (walletAddress) {
          if (room.hosts.includes(walletAddress)) {
            userRole = 'HOST';
          } else {
            const participant = room.participants.find(
              (p) => p.participantAddress === walletAddress,
            );
            if (participant) {
              userRole = participant.role as 'HOST' | 'PARTICIPANT';
            }
          }
        }

        return {
          roomId: room.roomId,
          title: room.title,
          hosts: room.hosts,
          status: this.getRoomStatus(room.status),
          maxParticipants: Number(room.maxParticipants),
          requireApproval: room.requireApproval,
          participantCount: room.participantCount,
          sealPolicyId: room.sealPolicyId,
          createdAt: this.unixToDate(room.createdAt),
          startedAt: this.unixToDate(room.startedAt),
          endedAt: this.unixToDate(room.endedAt),
          transactionDigest: room.transactionDigest,
          language: room.metadata?.language,
          timezone: room.metadata?.timezone,
          recordingBlobId: room.metadata?.recordingBlobId?.toString(),
          pendingApprovals: room.approvals.length,
          userRole,
        };
      }),
    };
  }

  async getRoomById(roomId: string) {
    const meetingRoom = await this.prisma.meetingRoom.findUnique({
      where: { roomId },
      include: {
        participants: {
          orderBy: {
            joinedAt: 'desc',
          },
        },
        metadata: true,
        approvals: {
          where: { status: 'pending' },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!meetingRoom) {
      throw new NotFoundException('Room not found');
    }

    const hosts = meetingRoom.participants.filter((p) => p.role === 'HOST');
    const participants = meetingRoom.participants.filter(
      (p) => p.role === 'PARTICIPANT',
    );

    return {
      room: {
        roomId: meetingRoom.roomId,
        title: meetingRoom.title,
        status: this.getRoomStatus(meetingRoom.status),
        maxParticipants: Number(meetingRoom.maxParticipants),
        requireApproval: meetingRoom.requireApproval,
        participantCount: meetingRoom.participantCount,
        sealPolicyId: meetingRoom.sealPolicyId,
        createdAt: this.unixToDate(meetingRoom.createdAt),
        startedAt: this.unixToDate(meetingRoom.startedAt),
        endedAt: this.unixToDate(meetingRoom.endedAt),
        transactionDigest: meetingRoom.transactionDigest,
        checkpointSequenceNumber: Number(meetingRoom.checkpointSequenceNumber),
      },
      hosts: hosts.map((h) => ({
        address: h.participantAddress,
        adminCapId: h.adminCapId,
        joinedAt: h.joinedAt,
      })),
      participants: participants.map((p) => ({
        address: p.participantAddress,
        joinedAt: p.joinedAt,
      })),
      metadata: meetingRoom.metadata
        ? {
            language: meetingRoom.metadata.language,
            timezone: meetingRoom.metadata.timezone,
            recordingBlobId: meetingRoom.metadata.recordingBlobId?.toString(),
            dynamicFieldId: meetingRoom.metadata.dynamicFieldId,
          }
        : null,
      pendingApprovals: meetingRoom.approvals.map((a) => ({
        id: a.id,
        requesterAddress: a.requesterAddress,
        createdAt: a.createdAt,
      })),
    };
  }

  async createRoom(dto: CreateRoomDto) {
    const {
      title,
      onchainObjectId,
      walletAddress,
      requireApproval = false,
      initialParticipants = [],
    } = dto;

    if (!onchainObjectId.startsWith('0x') || onchainObjectId.length !== 66) {
      throw new BadRequestException('Invalid onchainObjectId format');
    }

    const existingRoom = await this.prisma.meetingRoom.findUnique({
      where: { roomId: onchainObjectId },
    });

    if (existingRoom) {
      return {
        room: {
          id: existingRoom.roomId,
          onchainObjectId: existingRoom.roomId,
          title: existingRoom.title,
          requireApproval: existingRoom.requireApproval,
          createdAt: this.unixToDate(existingRoom.createdAt),
        },
        memberships: existingRoom.participantCount,
        indexed: true,
      };
    }

    return {
      room: {
        id: onchainObjectId,
        onchainObjectId: onchainObjectId,
        title: title,
        requireApproval: requireApproval,
        createdAt: new Date(),
      },
      memberships: initialParticipants.length,
      indexed: false,
      message: 'Room creation acknowledged. Waiting for indexer to sync...',
    };
  }

  async createApprovalRequest(roomId: string, walletAddress: string) {
    const meetingRoom = await this.prisma.meetingRoom.findUnique({
      where: { roomId },
    });

    if (!meetingRoom) {
      throw new NotFoundException('Room not found');
    }

    if (!meetingRoom.requireApproval) {
      throw new BadRequestException('Room does not require approval');
    }

    const existingParticipant = await this.prisma.roomParticipant.findUnique({
      where: {
        roomId_participantAddress: {
          roomId,
          participantAddress: walletAddress,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('Already a participant');
    }

    const existingApproval = await this.prisma.approvalRequest.findFirst({
      where: {
        roomId,
        requesterAddress: walletAddress,
        status: 'pending',
      },
    });

    if (existingApproval) {
      throw new BadRequestException('Approval request already pending');
    }

    const approvalRequest = await this.prisma.approvalRequest.create({
      data: {
        roomId,
        requesterAddress: walletAddress,
        status: 'pending',
      },
    });

    return {
      approvalRequest: {
        id: approvalRequest.id,
        roomId: approvalRequest.roomId,
        requesterAddress: approvalRequest.requesterAddress,
        status: approvalRequest.status,
        createdAt: approvalRequest.createdAt,
      },
    };
  }

  async approveGuest(
    roomId: string,
    requestId: string,
    walletAddress: string,
    dto: ApproveGuestDto,
  ) {
    const meetingRoom = await this.prisma.meetingRoom.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: {
            participantAddress: walletAddress,
            role: 'HOST',
          },
        },
      },
    });

    if (!meetingRoom) {
      throw new NotFoundException('Room not found');
    }

    if (meetingRoom.participants.length === 0) {
      throw new ForbiddenException('Only room hosts can approve guests');
    }

    const approvalRequest = await this.prisma.approvalRequest.updateMany({
      where: {
        id: requestId,
        roomId,
        status: 'pending',
      },
      data: {
        status: 'approved',
        resolvedAt: new Date(),
        resolverAddress: walletAddress,
        resolutionTxDigest: dto.txDigest || null,
      },
    });

    if (approvalRequest.count === 0) {
      throw new NotFoundException(
        'Approval request not found or already processed',
      );
    }

    return {
      message: 'Approval request approved',
      txDigest: dto.txDigest || null,
    };
  }

  async denyGuest(roomId: string, requestId: string, walletAddress: string) {
    const meetingRoom = await this.prisma.meetingRoom.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: {
            participantAddress: walletAddress,
            role: 'HOST',
          },
        },
      },
    });

    if (!meetingRoom) {
      throw new NotFoundException('Room not found');
    }

    if (meetingRoom.participants.length === 0) {
      throw new ForbiddenException('Only room hosts can deny guests');
    }

    const approvalRequest = await this.prisma.approvalRequest.updateMany({
      where: {
        id: requestId,
        roomId,
        status: 'pending',
      },
      data: {
        status: 'denied',
        resolvedAt: new Date(),
        resolverAddress: walletAddress,
      },
    });

    if (approvalRequest.count === 0) {
      throw new NotFoundException(
        'Approval request not found or already processed',
      );
    }

    return {
      message: 'Approval request denied',
    };
  }
}

