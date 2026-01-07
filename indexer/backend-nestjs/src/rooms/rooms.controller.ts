import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { JWTPayload } from '../types';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApproveGuestDto } from './dto/approve.dto';

@Controller('api/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async getAllRooms(
    @Query('walletAddress') walletAddress?: string,
    @Query('status') status?: string,
  ) {
    return this.roomsService.getAllRooms(walletAddress, status);
  }

  @Get(':roomId')
  async getRoomById(@Param('roomId') roomId: string) {
    return this.roomsService.getRoomById(roomId);
  }

  @Post()
  async createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @Post(':roomId/approval-request')
  @UseGuards(JwtAuthGuard)
  async createApprovalRequest(
    @Param('roomId') roomId: string,
    @User() user: JWTPayload,
  ) {
    return this.roomsService.createApprovalRequest(roomId, user.wal);
  }

  @Post(':roomId/approve/:requestId')
  @UseGuards(JwtAuthGuard)
  async approveGuest(
    @Param('roomId') roomId: string,
    @Param('requestId') requestId: string,
    @User() user: JWTPayload,
    @Body() dto: ApproveGuestDto,
  ) {
    return this.roomsService.approveGuest(roomId, requestId, user.wal, dto);
  }

  @Post(':roomId/deny/:requestId')
  @UseGuards(JwtAuthGuard)
  async denyGuest(
    @Param('roomId') roomId: string,
    @Param('requestId') requestId: string,
    @User() user: JWTPayload,
  ) {
    return this.roomsService.denyGuest(roomId, requestId, user.wal);
  }
}

