import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  const prisma = { $queryRaw: jest.fn() };
  const config = { get: jest.fn((key: string) => (key === 'SMTP_HOST' || key === 'SMTP_USER' || key === 'SMTP_PASSWORD' ? 'configured' : '')) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    controller = module.get(AppController);
  });

  it('reports API health', () => {
    expect(controller.health()).toEqual(
      expect.objectContaining({ status: 'ok', service: 'nova-store-api' }),
    );
  });

  it('reports safe email diagnostics without exposing values', () => {
    expect(controller.emailDiagnostics()).toEqual(
      expect.objectContaining({
        status: 'configured',
        smtp: expect.objectContaining({
          host: true,
          user: true,
          password: true,
        }),
      }),
    );
  });
});
