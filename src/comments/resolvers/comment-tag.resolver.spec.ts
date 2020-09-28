import { Test, TestingModule } from '@nestjs/testing';
import { CommentTagResolver } from './comment-tag.resolver';

describe('CommentTagResolver', () => {
  let resolver: CommentTagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentTagResolver],
    }).compile();

    resolver = module.get<CommentTagResolver>(CommentTagResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
