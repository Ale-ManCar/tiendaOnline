import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from './auth.cookies';
import type { AuthenticatedUser, RequestMetadata } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto, metadata(request));
    setAuthCookies(response, result.access, result.refresh);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, metadata(request));
    setAuthCookies(response, result.access, result.refresh);
    return { user: result.user };
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.refresh(
      request.cookies?.[REFRESH_COOKIE] as string | undefined,
      metadata(request),
    );
    setAuthCookies(response, result.access, result.refresh);
    return { user: result.user };
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(
      request.cookies?.[REFRESH_COOKIE] as string | undefined,
    );
    clearAuthCookies(response);
  }

  @HttpCode(204)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logoutAll(user.id);
    clearAuthCookies(response);
  }

  @Get('me') me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }
}

function metadata(request: Request): RequestMetadata {
  return { ipAddress: request.ip, userAgent: request.get('user-agent') };
}
