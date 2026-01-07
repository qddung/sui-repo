import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { JWTPayload } from '../types';
import { CreateEphemeralKeyDto } from './dto/ephemeral-key.dto';
import { AutoSignDto } from './dto/auto-sign.dto';

@Controller('api/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('ephemeral-key')
  async createEphemeralKey(
    @User() user: JWTPayload,
    @Body() dto: CreateEphemeralKeyDto,
  ) {
    return this.sessionsService.createEphemeralKey(user.sid, dto);
  }

  @Post('auto-sign')
  async autoSign(@User() user: JWTPayload, @Body() dto: AutoSignDto) {
    return this.sessionsService.autoSign(user.sid, dto);
  }

  @Get('me')
  async getSessionInfo(@User() user: JWTPayload) {
    return this.sessionsService.getSessionInfo(user.sid);
  }
}

