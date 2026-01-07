import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { JwtModule } from './common/jwt/jwt.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { RoomsModule } from './rooms/rooms.module';
import { ChildWalletModule } from './child-wallet/child-wallet.module';
import { SignalingModule } from './signaling/signaling.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CryptoModule,
    JwtModule,
    AuthModule,
    SessionsModule,
    RoomsModule,
    ChildWalletModule,
    SignalingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

