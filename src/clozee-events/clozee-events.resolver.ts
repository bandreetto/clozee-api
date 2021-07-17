import { Args, Query, Resolver } from '@nestjs/graphql';
import dayjs from 'dayjs';
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
      startAt: dayjs().subtract(2, 'hours').toDate(),
      endAt: dayjs().add(2, 'hours').toDate(),
      posts: await this.postsService.findLastDistinctUsersPosts(3),
    };
  }
}
