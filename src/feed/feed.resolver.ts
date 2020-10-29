import { Args, Resolver, Query } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/types';
import { PostsService } from 'src/posts/posts.service';
import { FeedPostConnection } from './contracts/domain';
import { fromPostsToConnection } from './feed.logic';

@Resolver()
export class FeedResolver {
  constructor(private postsService: PostsService) {}

  @Query(() => FeedPostConnection)
  async feed(@Args() args: PaginationArgs): Promise<FeedPostConnection> {
    let afterDate: Date;
    if (args.after) {
      const decodedCursor = Buffer.from(args.after, 'base64').toString();
      afterDate = new Date(decodedCursor);
    }
    const posts = await this.postsService.findSortedBy(
      args.first,
      'createdAt',
      afterDate,
    );
    const postsCount = await this.postsService.countAfter({
      createdAt: afterDate,
    });
    const connection = fromPostsToConnection(
      posts,
      postsCount - args.first > 0,
    );
    return connection;
  }
}
