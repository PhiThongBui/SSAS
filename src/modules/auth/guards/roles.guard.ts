import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleCode } from '../../roles/user_venue_roles.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: { roles: string[] } }>();
    console.log('request', request);

    const { user } = request;
    const hasRole = requiredRoles.some((role) => user?.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    return true;
  }
}
