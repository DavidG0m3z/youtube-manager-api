import {
    IsEmail,
    IsEnum,
    IsString,
    MinLength
} from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterDto {

    @IsEmail({}, { message: 'El email debe ser valido' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'El password debe tener al menos 8 caracteres' })
    password: string;

    @IsEnum(Role, { message: 'El rol debe ser admin o user' })
    role: Role;
}