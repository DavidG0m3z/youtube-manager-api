import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from '../users.repository';


export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        private readonly usersRepository: UsersRepository,
        configService: ConfigService,
    ){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('app.jwtSecret')!,
        });
    }

    async validate(payload: JwtPayload) {
        
        const user = await this.usersRepository.findById(payload.sub);

        if (!user) {
          throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }
}