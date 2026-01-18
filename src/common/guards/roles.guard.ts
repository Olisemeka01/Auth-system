import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/auth/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { hasRequiredRole } from '../../modules/auth/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Clients can only access endpoints that explicitly allow Role.CLIENT
    if (user.type === 'client') {
      return requiredRoles.includes(Role.CLIENT);
    }

    // Users must have one of the required roles
    const userRoles = user.roles || [];

    return hasRequiredRole(userRoles as Role[], requiredRoles);
  }
}