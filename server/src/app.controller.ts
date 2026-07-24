import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from './auth/public.decorator';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      service: 'nova-store-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @Public()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'nova-store-api',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException(
        'Database is not reachable. Check DATABASE_URL credentials.',
      );
    }
  }

  @Get('diagnostics/email')
  @Public()
  emailDiagnostics() {
    const hasHost = Boolean(this.config.get<string>('SMTP_HOST')?.trim());
    const hasUser = Boolean(this.config.get<string>('SMTP_USER')?.trim());
    const hasPassword = Boolean(
      this.config.get<string>('SMTP_PASSWORD')?.trim(),
    );
    const hasFrom = Boolean(this.config.get<string>('SMTP_FROM')?.trim());

    return {
      status: hasHost && hasUser && hasPassword ? 'configured' : 'missing',
      smtp: {
        host: hasHost,
        user: hasUser,
        password: hasPassword,
        from: hasFrom,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
