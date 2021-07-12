import { Test, TestingModule } from '@nestjs/testing';
import { ExploreResolver } from './explore.resolver';

describe('ExploreResolver', () => {
  let resolver: ExploreResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExploreResolver],
    }).compile();

    resolver = module.get<ExploreResolver>(ExploreResolver);
  });

  it('should resolve the events field', () => {
    expect(resolver).toBeDefined();
  });
});
