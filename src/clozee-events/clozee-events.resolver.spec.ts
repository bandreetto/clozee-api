import { Test, TestingModule } from '@nestjs/testing';
import { ClozeeEventsResolver } from './clozee-events.resolver';

describe('ClozeeEventsResolver', () => {
  let resolver: ClozeeEventsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClozeeEventsResolver],
    }).compile();

    resolver = module.get<ClozeeEventsResolver>(ClozeeEventsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
