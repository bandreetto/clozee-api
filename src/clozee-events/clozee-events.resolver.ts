import { Args, Query, Resolver } from '@nestjs/graphql';
import { PostsService } from 'src/posts/posts.service';
import { ClozeeEvent } from './contracts';

@Resolver(() => ClozeeEvent)
export class ClozeeEventsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => ClozeeEvent)
  async event(@Args('id') id: number): Promise<ClozeeEvent> {
    return {
      id,
      title: 'Feirinha da Clozee',
      bannerUrl: 'https://placekitten.com/500/200',
      startAt: new Date(),
      endAt: new Date(),
      posts: await this.postsService.findLastDistinctUsersPosts(3),
    };
  }
}
