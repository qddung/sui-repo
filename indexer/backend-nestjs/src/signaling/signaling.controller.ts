import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SignalingService } from './signaling.service';
import { OfferDto, AnswerDto, CandidateDto, EndCallDto } from './dto/signaling.dto';

@Controller('api/signaling')
export class SignalingController {
  constructor(private readonly signalingService: SignalingService) {}

  @Post(':roomId/offer')
  setOffer(@Param('roomId') roomId: string, @Body() dto: OfferDto) {
    if (!dto.sdp) {
      throw new BadRequestException('Missing sdp');
    }
    return this.signalingService.setOffer(roomId, dto.sdp);
  }

  @Get(':roomId/offer')
  getOffer(@Param('roomId') roomId: string) {
    const offer = this.signalingService.getOffer(roomId);
    if (!offer) {
      throw new NotFoundException('No offer');
    }
    return offer;
  }

  @Post(':roomId/answer')
  setAnswer(@Param('roomId') roomId: string, @Body() dto: AnswerDto) {
    if (!dto.sdp) {
      throw new BadRequestException('Missing sdp');
    }
    return this.signalingService.setAnswer(roomId, dto.sdp);
  }

  @Get(':roomId/answer')
  getAnswer(@Param('roomId') roomId: string) {
    const answer = this.signalingService.getAnswer(roomId);
    if (!answer) {
      throw new NotFoundException('No answer');
    }
    return answer;
  }

  @Post(':roomId/candidates')
  addCandidate(
    @Param('roomId') roomId: string,
    @Body() dto: CandidateDto,
  ) {
    if (!dto.candidate || !dto.from) {
      throw new BadRequestException('Missing candidate or from');
    }
    return this.signalingService.addCandidate(
      roomId,
      dto.candidate,
      dto.from,
    );
  }

  @Get(':roomId/candidates')
  getCandidates(
    @Param('roomId') roomId: string,
    @Query('role') role?: 'host' | 'guest',
  ) {
    if (!role) {
      throw new BadRequestException('Role not provided');
    }
    const result = this.signalingService.getCandidates(roomId, role);
    if (!result) {
      throw new NotFoundException('No candidates or role not provided');
    }
    return result;
  }

  @Get(':roomId/debug')
  getDebugInfo(@Param('roomId') roomId: string) {
    return this.signalingService.getDebugInfo(roomId);
  }

  @Post(':roomId/end')
  endCall(@Param('roomId') roomId: string, @Body() dto: EndCallDto) {
    return this.signalingService.endCall(roomId, dto.role);
  }
}

