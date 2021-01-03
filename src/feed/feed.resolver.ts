import { Args, Resolver, Query } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/types';
import { PostsService } from 'src/posts/posts.service';
import { FeedPostConnection } from './contracts';
import { fromPostsToConnection } from './feed.logic';
import { FeedService } from './feed.service';

@Resolver()
export class FeedResolver {
  constructor(
    private postsService: PostsService,
    private feedService: FeedService,
  ) {}

  @Query(() => FeedPostConnection)
  async feed(@Args() args: PaginationArgs): Promise<FeedPostConnection> {
    let date: Date;
    if (args.after) {
      const decodedCursor = Buffer.from(args.after, 'base64').toString();
      date = new Date(decodedCursor);
    }
    const feedPosts = await this.feedService.findSortedByDate(args.first, date);
    const posts = await this.postsService.findManyByIds(
      feedPosts.map(f => f.post),
    );
    const orderedPosts = feedPosts.map(feedPost =>
      posts.find(post => post._id === feedPost.post),
    );
    const postsCount = await this.feedService.countAfter(date);
    const connection = fromPostsToConnection(
      orderedPosts,
      postsCount - args.first > 0,
    );
    return connection;
  }
}
