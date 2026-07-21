import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { AccountStatus, UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {
    const secret = this.config.get<string>('SESSION_SECRET');
    if (!secret || secret.length < 32)
      throw new Error('SESSION_SECRET must contain at least 32 characters.');
    this.secret = secret;
  }

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    try {
      const requireEmailVerification = this.emailVerificationRequired();
      if (requireEmailVerification && !this.mail.isConfigured) {
        throw new ServiceUnavailableException(
          'Email verification is enabled, but SMTP is not configured.',
        );
      }

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
          status: requireEmailVerification
            ? AccountStatus.PENDING_VERIFICATION
            : AccountStatus.ACTIVE,
          emailVerifiedAt: requireEmailVerification ? undefined : new Date(),
        },
      });

      await this.audit(user.id, 'auth.registered', metadata);

      if (requireEmailVerification) {
        const token = await this.createEmailVerificationToken(user.id);
        await this.sendVerificationEmail(user, token);
        return { user: this.publicUser(user), verificationRequired: true };
      }

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
      if (user.status === AccountStatus.PENDING_VERIFICATION)
        throw new UnauthorizedException(
          'Please verify your email before signing in.',
        );
      if (user.status !== AccountStatus.ACTIVE)
        throw new UnauthorizedException('This account is not active.');
      await this.audit(user.id, 'auth.logged_in', metadata);
      return this.issueSession(user, metadata);
    } catch (error) {
      this.handleDatabaseAvailability(error);
      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto, metadata: RequestMetadata) {
    const tokenHash = this.hashVerificationToken(dto.token);
    const verification = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!verification)
      throw new UnauthorizedException('Verification link is invalid or expired.');
    if (verification.user.status === AccountStatus.SUSPENDED)
      throw new UnauthorizedException('This account is not active.');

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      });
      return tx.user.update({
        where: { id: verification.userId },
        data: {
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: verification.user.emailVerifiedAt ?? new Date(),
        },
      });
    });

    await this.audit(user.id, 'auth.email_verified', metadata);
    return { user: this.publicUser(user) };
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

  private emailVerificationRequired() {
    return (
      this.config.get<string>('AUTH_REQUIRE_EMAIL_VERIFICATION', 'false') ===
      'true'
    );
  }

  private hashVerificationToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createEmailVerificationToken(userId: string) {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashVerificationToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }

  private async sendVerificationEmail(
    user: { name: string; email: string },
    token: string,
  ) {
    const publicUrl = this.config
      .get<string>('APP_PUBLIC_URL', 'http://localhost:5173')
      .replace(/\/$/, '');
    const link = `${publicUrl}/#/verificar-email?token=${encodeURIComponent(token)}`;

    await this.mail.send({
      to: user.email,
      subject: 'Verifica tu cuenta en Nova Store',
      text: `Hola ${user.name}, verifica tu cuenta abriendo este enlace: ${link}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#17181d">
          <h2>Verifica tu cuenta</h2>
          <p>Hola ${escapeHtml(user.name)}, confirma tu correo para activar tu cuenta en Nova Store.</p>
          <p><a href="${link}" style="background:#ff563f;color:white;padding:12px 18px;border-radius:10px;text-decoration:none">Verificar cuenta</a></p>
          <p>Este enlace vence en 24 horas.</p>
        </div>
      `,
    });
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[character] ?? character;
  });
}
