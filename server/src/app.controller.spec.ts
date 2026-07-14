import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get(AppController);
  });

  it('reports API health', () => {
    expect(controller.health()).toEqual(
      expect.objectContaining({ status: 'ok', service: 'nova-store-api' }),
    );
  });
});
