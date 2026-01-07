import { Module } from '@nestjs/common';
import { ChildWalletController } from './child-wallet.controller';
import { ChildWalletService } from './child-wallet.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CryptoModule } from '../common/crypto/crypto.module';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [ChildWalletController],
  providers: [ChildWalletService],
  exports: [ChildWalletService],
})
export class ChildWalletModule {}

