import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '../generated/prisma/enums';
import type { AuthenticatedUser } from './auth.types';
import { ROLES } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = (
      context.switchToHttp().getRequest<Request>() as Request & {
        user: AuthenticatedUser;
      }
    ).user;
    if (!user || !roles.includes(user.role))
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    return true;
  }
}
