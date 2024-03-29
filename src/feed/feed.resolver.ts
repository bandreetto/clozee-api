import { ForbiddenException, Logger, UseGuards } from '@nestjs/common';
import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';
import { CurrentUser, TokenTypes } from '../common/decorators';
import { PaginationArgs, TokenUser } from '../common/types';
import { SIZES } from '../posts/contracts/enums';
import { PostsService } from '../posts/posts.service';
import { FeedTags } from '../users/contracts';
import { GENDER_TAGS } from '../users/contracts/enum';
import { FeedTagsInput } from '../users/contracts/inputs';
import { UserFeed, FeedPostConnection, Feed } from './contracts';
import { decodeCursor, fromPostsToConnection } from './feed.logic';
import { UserFeedService } from './user-feed.service';
import { SeenPostService } from './seen-post.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { SessionsService } from '../sessions/sessions.service';
import { v4 } from 'uuid';
import { TOKEN_TYPES } from '../auth/contracts/enums';
import { EventEmitter2 } from 'eventemitter2';
import { uniq } from 'ramda';
import { FeedService } from './feed.service';

@Resolver()
export class FeedResolver {
  logger = new Logger(FeedResolver.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly userFeedService: UserFeedService,
    private readonly feedService: FeedService,
    private readonly seenPostService: SeenPostService,
    private readonly sessionsService: SessionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.ACCESS, TOKEN_TYPES.PRE_SIGN)
  @Query(() => FeedPostConnection)
  async feed(
    @Args() args: PaginationArgs,
    @Args('tags', { nullable: true }) feedTags: FeedTagsInput,
    @Args('searchTerm', { nullable: true }) searchTerm: string,
    @CurrentUser() user: TokenUser,
  ): Promise<FeedPostConnection> {
    let date: Date, score: number;
    if (args.after) {
      [date, score] = decodeCursor(args.after);
      this.logger.debug(`Paginating feed with date ${date} and score ${score}`);
    }
    let tags: FeedTags;
    if (feedTags) {
      const sizes = feedTags.sizes.length ? feedTags.sizes : Object.values(SIZES);
      const genders = feedTags.genders.length ? feedTags.genders : Object.values(GENDER_TAGS);
      tags = {
        sizes: uniq([...sizes, SIZES.OTHER, SIZES.UNIQUE]),
        genders: uniq([...genders, GENDER_TAGS.NEUTRAL]),
      };
    } else {
      tags = {
        sizes: Object.values(SIZES),
        genders: Object.values(GENDER_TAGS),
      };
    }

    const postBlacklist = await this.seenPostService.findBlacklistedPosts(user._id);
    let feedPosts: UserFeed[], postsCount: number;
    if (searchTerm) {
      let searchResult: Feed[];
      [searchResult, postsCount] = await Promise.all([
        this.feedService.searchByTerm(
          searchTerm,
          tags,
          args.first,
          score,
          date,
          postBlacklist ? [...postBlacklist.posts, ...(postBlacklist.blockedUsersPosts || [])] : [],
        ),
        this.feedService.countBySearchTerm(
          searchTerm,
          tags,
          score,
          date,
          postBlacklist ? [...postBlacklist.posts, ...(postBlacklist.blockedUsersPosts || [])] : [],
        ),
      ]);
      feedPosts = searchResult.map(p => ({ ...p, score: p.searchScore, user: user._id }));
    } else {
      [feedPosts, postsCount] = await Promise.all([
        this.userFeedService.findSortedByScore(
          user._id,
          args.first,
          args.after && { maxScore: score, before: date },
          tags,
          postBlacklist ? [...postBlacklist.posts, ...(postBlacklist.blockedUsersPosts || [])] : [],
        ),
        this.userFeedService.countByScore(
          user._id,
          tags,
          args.after && {
            maxScore: score,
            before: date,
          },
          postBlacklist ? [...postBlacklist.posts, ...(postBlacklist.blockedUsersPosts || [])] : [],
        ),
      ]);
    }

    const posts = await this.postsService.findManyByIds(feedPosts.map(f => f.post));
    const orderedPosts = feedPosts.map(feedPost => ({
      feedPost,
      post: posts.find(post => post._id === feedPost.post),
      score: feedPost.score,
    }));
    const hasNextPage = postsCount - args.first > 0;
    const connection = fromPostsToConnection(orderedPosts, hasNextPage);
    if (!searchTerm && !hasNextPage && user?._id) await this.eventEmitter.emitAsync('feed.endReached', user._id);
    return connection;
  }

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.ACCESS, TOKEN_TYPES.PRE_SIGN)
  @Mutation(() => String)
  markPostAsSeen(@Args('post', { description: 'The post id.' }) post: string, @CurrentUser() user: TokenUser): string {
    const seenPostId = v4();
    this.sessionsService
      .findByUser(user._id, true)
      .then(([session]) => {
        if (!session) throw new ForbiddenException('No open session found for this user.');
        return this.seenPostService.create({
          _id: seenPostId,
          post,
          session: session._id,
          user: session.user,
        });
      })
      .then(() => this.logger.log(`Post ${post} marked as seen for user ${user._id}. SeenPostId: ${seenPostId}`))
      .catch(error =>
        this.logger.error({
          message: `Failed to mark post ${post} as seen for user ${user._id}`,
          error: error.toString(),
        }),
      );

    return seenPostId;
  }
}
