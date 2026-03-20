import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
    
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
    ){}

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const emailExist = await this.usersRepository.existsByEmail(
            registerDto.email,
        );

        if (emailExist) {
            throw new ConflictException('Email exist')
        }

        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        
        const user = await this.usersRepository.create({
            email:registerDto.email,
            passwordHash,
            role: registerDto.role,
        });

        return this.buildAuthResponse(user)
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        
        const user = await this.usersRepository.findByEmail(loginDto.email);

        if(!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash,
        );

        if(!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.buildAuthResponse(user);
    }

    private buildAuthResponse(user: User): AuthResponseDto {

        const payload = {
          sub: user.id,      
          email: user.email,
          role: user.role,
        };

        return {
          accessToken: this.jwtService.sign(payload),
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        };
    }
}