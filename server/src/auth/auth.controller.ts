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
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
    if ('access' in result && 'refresh' in result) {
      setAuthCookies(response, result.access, result.refresh);
    }
    return {
      user: result.user,
      verificationRequired: 'verificationRequired' in result,
    };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request) {
    return this.auth.verifyEmail(dto, metadata(request));
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
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/forgot')
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Req() request: Request,
  ) {
    await this.auth.requestPasswordReset(dto, metadata(request));
    return {
      message:
        'If an account exists for this email, password recovery instructions were sent.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    await this.auth.resetPassword(dto, metadata(request));
    return { message: 'Password changed successfully.' };
  }

  @HttpCode(200)
  @Post('password/change')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    await this.auth.changePassword(user.id, dto, metadata(request));
    return { message: 'Password changed successfully.' };
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
