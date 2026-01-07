import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChildWalletService } from './child-wallet.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { JWTPayload } from '../types';
import { CreateChildWalletDto } from './dto/create-child-wallet.dto';
import { SignTransactionDto } from './dto/sign.dto';

@Controller('api/child-wallet')
@UseGuards(JwtAuthGuard)
export class ChildWalletController {
  constructor(private readonly childWalletService: ChildWalletService) {}

  @Post('create')
  async createChildWallet(
    @User() user: JWTPayload,
    @Body() dto: CreateChildWalletDto,
  ) {
    return this.childWalletService.createChildWallet(user.sid, dto);
  }

  @Get('list')
  async listChildWallets(@User() user: JWTPayload) {
    return this.childWalletService.listChildWallets(user.sid);
  }

  @Post('sign')
  async signTransaction(
    @User() user: JWTPayload,
    @Body() dto: SignTransactionDto,
  ) {
    return this.childWalletService.signTransaction(user.sid, dto);
  }

  @Delete(':id')
  async revokeChildWallet(
    @User() user: JWTPayload,
    @Param('id') id: string,
  ) {
    return this.childWalletService.revokeChildWallet(user.sid, id);
  }
}

