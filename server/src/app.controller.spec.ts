import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
    controller = module.get(AppController);
  });

  it('reports API health', () => {
    expect(controller.health()).toEqual(
      expect.objectContaining({ status: 'ok', service: 'nova-store-api' }),
    );
  });
});
