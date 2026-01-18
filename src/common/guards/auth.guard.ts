import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../../modules/auth/enums/role.enum';

/**
 * Unified authentication and authorization guard
 * Combines JWT validation and role checking in a single pass
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Validate JWT token
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Check role requirements
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
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

    // Users must have at least one of the required roles
    const userRoles = user.roles || [];
    return userRoles.some((userRole: Role) => requiredRoles.includes(userRole));
  }
}
