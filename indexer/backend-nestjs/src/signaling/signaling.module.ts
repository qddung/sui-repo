import { Module } from '@nestjs/common';
import { SignalingController } from './signaling.controller';
import { SignalingService } from './signaling.service';

@Module({
  controllers: [SignalingController],
  providers: [SignalingService],
  exports: [SignalingService],
})
export class SignalingModule {}

