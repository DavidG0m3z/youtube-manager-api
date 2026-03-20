import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/auth/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {

    constructor (
        private reflector: Reflector
    ){}

    canActivate(context: ExecutionContext): boolean {
        
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();

        if(!user){
            throw new ForbiddenException('Access denied');
        }

        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(', ')}`,);
        }

        return true;
    }
}