import { Args, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import dayjs from 'dayjs';
import { Post } from '../posts/contracts';
import { PostsLoader } from '../posts/posts.dataloader';
import { PostsService } from '../posts/posts.service';
import { ClozeeEvent } from './contracts';

@Resolver(() => ClozeeEvent)
export class ClozeeEventsResolver {
  constructor(private readonly postsService: PostsService, private readonly postsLoader: PostsLoader) {}

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

  @ResolveField()
  posts(@Root() event: ClozeeEvent): Promise<Post[]> {
    return Promise.all((event.posts as string[]).map(p => this.postsLoader.load(p)));
  }
}
