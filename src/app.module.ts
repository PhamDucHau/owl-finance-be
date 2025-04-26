import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import { User, UserSchema } from './auth/schemas/user.schema';
import { CardModule } from './card/card.module';
import { FriendModule } from './auth/socket/friend.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    FriendModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: true,
      load: [config]
    }),
    MongooseModule.forRoot('mongodb://khoadue.me:32775/owl-finance'),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config) => ({       
        secret: config.get('JWT_SECRET'),
      }),
      global: true,
      inject: [ConfigService],
      // secret: '123',
    }),
    AuthModule,
    CardModule,  
    MinioModule  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
