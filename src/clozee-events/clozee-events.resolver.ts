import { Args, Query, Resolver } from '@nestjs/graphql';
import { ClozeeEvent } from './contracts';

@Resolver(() => ClozeeEvent)
export class ClozeeEventsResolver {
  @Query(() => ClozeeEvent)
  async event(@Args('id') id: number): Promise<ClozeeEvent> {
    return {
      id,
      title: 'Feirinha da Clozee',
      bannerUrl: 'url do banner',
      startAt: new Date(),
      endAt: new Date(),
      posts: [],
    };
  }
}
