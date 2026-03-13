import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import { RoomAccessService } from './services/room-access.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    AuthModule, // Provides AuthService
    DatabaseModule, // Provides PrismaService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [RealtimeGateway, RoomAccessService],
  exports: [RealtimeGateway, RoomAccessService],
})
export class RealtimeModule {}
