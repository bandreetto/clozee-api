import { Test, TestingModule } from '@nestjs/testing';
import { PagarmePostbacksController } from './pagarme-postbacks.controller';

describe('PagarmePostbacksController', () => {
  let controller: PagarmePostbacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagarmePostbacksController],
    }).compile();

    controller = module.get<PagarmePostbacksController>(PagarmePostbacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
