import { OnEvent } from '@nestjs/event-emitter';
import { Args, Resolver, Query } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/types';
import { PostsService } from 'src/posts/posts.service';
import { FeedPostConnection } from './contracts';
import { fromPostsToConnection } from './feed.logic';
import { FeedService } from './feed.service';
import { v4 } from 'uuid';
import { Post } from 'src/posts/contracts';

@Resolver()
export class FeedResolver {
  constructor(
    private postsService: PostsService,
    private feedService: FeedService,
  ) {}

  @OnEvent('post.created')
  handlePostCreated(post: Post) {
    return this.feedService.create({
      _id: v4(),
      post: post._id,
    });
  }

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
    const postsCount = await this.feedService.countAfter(date);
    const connection = fromPostsToConnection(
      posts,
      postsCount - args.first > 0,
    );
    return connection;
  }
}
