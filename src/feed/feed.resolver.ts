import { Args, Resolver, Query } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/types';
import { SIZES } from 'src/posts/contracts/enums';
import { PostsService } from 'src/posts/posts.service';
import { FeedTags } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { FeedTagsInput } from 'src/users/contracts/inputs';
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
  async feed(
    @Args() args: PaginationArgs,
    @Args('tags', { nullable: true }) feedTags: FeedTagsInput,
  ): Promise<FeedPostConnection> {
    let date: Date;
    if (args.after) {
      const decodedCursor = Buffer.from(args.after, 'base64').toString();
      date = new Date(decodedCursor);
    }
    let tags: FeedTags;
    if (feedTags) {
      tags = feedTags;
    } else {
      tags = {
        sizes: Object.values(SIZES),
        genders: Object.values(GENDER_TAGS),
      };
    }

    const feedPosts = await this.feedService.findSortedByDate(
      args.first,
      date,
      tags,
    );
    const posts = await this.postsService.findManyByIds(
      feedPosts.map(f => f.post),
    );
    const orderedPosts = feedPosts.map(feedPost => ({
      feedPost,
      post: posts.find(post => post._id === feedPost.post),
    }));
    const postsCount = await this.feedService.countAfter(date);
    const connection = fromPostsToConnection(
      orderedPosts,
      postsCount - args.first > 0,
    );
    return connection;
  }
}
