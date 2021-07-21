import { Args, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CmsService } from '../cms/cms.service';
import { Post } from '../posts/contracts';
import { PostsLoader } from '../posts/posts.dataloader';
import { ClozeeEvent } from './contracts';

@Resolver(() => ClozeeEvent)
export class ClozeeEventsResolver {
  constructor(private readonly postsLoader: PostsLoader, private readonly cmsService: CmsService) {}

  @Query(() => ClozeeEvent)
  async event(@Args('id') id: number): Promise<ClozeeEvent> {
    return this.cmsService.getEventById(id);
  }

  @ResolveField()
  posts(@Root() event: ClozeeEvent): Promise<Post[]> {
    return Promise.all((event.posts as string[]).map(p => this.postsLoader.load(p)));
  }
}
