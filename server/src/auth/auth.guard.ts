import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACCESS_COOKIE } from './auth.cookies';
import { AuthService } from './auth.service';
import { IS_PUBLIC } from './public.decorator';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<Request>() as Request & {
      user: AuthenticatedUser;
    };
    request.user = await this.auth.authenticate(
      request.cookies?.[ACCESS_COOKIE] as string | undefined,
    );
    return true;
  }
}
