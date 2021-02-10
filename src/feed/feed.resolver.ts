import { Args, Resolver, Query } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/types';
import { SIZES } from 'src/posts/contracts/enums';
import { PostsService } from 'src/posts/posts.service';
import { FeedTags } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { FeedTagsInput } from 'src/users/contracts/inputs';
import { Feed, FeedPostConnection } from './contracts';
import { decodeCursor, fromPostsToConnection } from './feed.logic';
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
    @Args('searchTerm', { nullable: true }) searchTerm: string,
  ): Promise<FeedPostConnection> {
    let date: Date, score: number;
    if (args.after) {
      [date, score] = decodeCursor(args.after);
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

    let feedPosts: Feed[], postsCount: number;
    if (searchTerm) {
      [feedPosts, postsCount] = await Promise.all([
        this.feedService.searchByTerm(
          searchTerm,
          tags,
          args.first,
          score,
          date,
        ),
        this.feedService.countBySearchTerm(searchTerm, tags, score, date),
      ]);
    } else {
      [feedPosts, postsCount] = await Promise.all([
        this.feedService.findSortedByDate(args.first, date, tags),
        this.feedService.countByDate(date, tags),
      ]);
    }

    const posts = await this.postsService.findManyByIds(
      feedPosts.map(f => f.post),
    );
    const orderedPosts = feedPosts.map(feedPost => ({
      feedPost,
      post: posts.find(post => post._id === feedPost.post),
    }));
    const connection = fromPostsToConnection(
      orderedPosts,
      postsCount - args.first > 0,
    );
    return connection;
  }
}
