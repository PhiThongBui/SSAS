import { SetMetadata } from '@nestjs/common';
import { RoleCode } from '../../roles/user_venue_roles.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
