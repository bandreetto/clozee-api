import { Test, TestingModule } from '@nestjs/testing';
import { LikesResolver } from './likes.resolver';

describe('LikesResolver', () => {
  let resolver: LikesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesResolver],
    }).compile();

    resolver = module.get<LikesResolver>(LikesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
