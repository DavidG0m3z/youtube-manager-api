import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersRepository } from './users.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('app.jwtSecret')!,
            signOptions: {
              expiresIn: configService.get<string>('app.jwtExpiresIn')! as any,
            },
          }),
          inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersRepository, JwtStrategy],
    exports: [JwtStrategy, JwtModule],
})
export class AuthModule {}