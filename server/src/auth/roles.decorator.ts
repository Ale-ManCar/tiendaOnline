import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../generated/prisma/enums';
export const ROLES = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);
