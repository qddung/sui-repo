import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CryptoModule } from '../common/crypto/crypto.module';
import { JwtModule } from '../common/jwt/jwt.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, CryptoModule, JwtModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

