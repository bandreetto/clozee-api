import { Test, TestingModule } from '@nestjs/testing';
import { TrendsResolver } from './trends.resolver';

describe('TrendsResolver', () => {
  let resolver: TrendsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrendsResolver],
    }).compile();

    resolver = module.get<TrendsResolver>(TrendsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
