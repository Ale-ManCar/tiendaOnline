import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AccountStatus, UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type {
  AuthenticatedUser,
  RequestMetadata,
  TokenPayload,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly secret: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    const secret = config.get<string>('SESSION_SECRET');
    if (!secret || secret.length < 32)
      throw new Error('SESSION_SECRET must contain at least 32 characters.');
    this.secret = secret;
  }

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    try {
      if (await this.prisma.user.findUnique({ where: { email: dto.email } }))
        throw new ConflictException('An account with this email already exists.');
      const passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          status: AccountStatus.ACTIVE,
        },
      });
      await this.audit(user.id, 'auth.registered', metadata);
      return this.issueSession(user, metadata);
    } catch (error) {
      this.handleDatabaseAvailability(error);
      throw error;
    }
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
        throw new UnauthorizedException('Invalid email or password.');
      if (user.status !== AccountStatus.ACTIVE)
        throw new UnauthorizedException('This account is not active.');
      await this.audit(user.id, 'auth.logged_in', metadata);
      return this.issueSession(user, metadata);
    } catch (error) {
      this.handleDatabaseAvailability(error);
      throw error;
    }
  }

  async refresh(token: string | undefined, metadata: RequestMetadata) {
    if (!token) throw new UnauthorizedException('Refresh session is missing.');
    const payload = await this.verifyToken(token, 'refresh');
    const session = payload.sessionId
      ? await this.prisma.refreshSession.findUnique({
          where: { id: payload.sessionId },
          include: { user: true },
        })
      : null;
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await argon2.verify(session.tokenHash, token))
    )
      throw new UnauthorizedException('Refresh session is invalid.');
    if (session.user.status !== AccountStatus.ACTIVE)
      throw new UnauthorizedException('This account is not active.');
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(session.user, metadata);
  }

  async logout(token?: string) {
    if (token) {
      try {
        const payload = await this.verifyToken(token, 'refresh');
        if (payload.sessionId)
          await this.prisma.refreshSession.updateMany({
            where: { id: payload.sessionId },
            data: { revokedAt: new Date() },
          });
      } catch {
        /* Logout remains idempotent. */
      }
    }
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async authenticate(accessToken?: string): Promise<AuthenticatedUser> {
    if (!accessToken)
      throw new UnauthorizedException('Authentication required.');
    const payload = await this.verifyToken(accessToken, 'access');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status !== AccountStatus.ACTIVE)
      throw new UnauthorizedException('Authentication required.');
    return this.publicUser(user);
  }

  private async issueSession(
    user: { id: string; name: string; email: string; role: UserRole },
    metadata: RequestMetadata,
  ) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: 'pending',
        expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
    const access = await this.jwt.signAsync<TokenPayload>(
      { sub: user.id, type: 'access' },
      { secret: this.secret, expiresIn: '15m' },
    );
    const refresh = await this.jwt.signAsync<TokenPayload>(
      { sub: user.id, sessionId: session.id, type: 'refresh' },
      { secret: this.secret, expiresIn: '30d' },
    );
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        tokenHash: await argon2.hash(refresh, { type: argon2.argon2id }),
      },
    });
    return { user: this.publicUser(user), access, refresh };
  }

  private async verifyToken(token: string, type: TokenPayload['type']) {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        secret: this.secret,
      });
      if (payload.type !== type) throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Session is invalid or expired.');
    }
  }
  private publicUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }): AuthenticatedUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
  private async audit(
    actorId: string,
    action: string,
    metadata: RequestMetadata,
  ) {
    await this.prisma.auditEvent.create({
      data: {
        actorId,
        action,
        entityType: 'User',
        entityId: actorId,
        ipAddress: metadata.ipAddress,
      },
    });
  }
  private handleDatabaseAvailability(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P1000'
    ) {
      throw new ServiceUnavailableException(
        'Database credentials are invalid. Check DATABASE_URL.',
      );
    }
  }
}
