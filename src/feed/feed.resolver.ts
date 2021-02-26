import { ForbiddenException, Logger, UseGuards } from '@nestjs/common';
import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { PaginationArgs, TokenUser } from 'src/common/types';
import { SIZES } from 'src/posts/contracts/enums';
import { PostsService } from 'src/posts/posts.service';
import { FeedTags } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { FeedTagsInput } from 'src/users/contracts/inputs';
import { Feed, FeedPostConnection } from './contracts';
import { decodeCursor, fromPostsToConnection } from './feed.logic';
import { FeedService } from './feed.service';
import { SeenPostService } from './seen-post.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { SessionsService } from '../sessions/sessions.service';
import { v4 } from 'uuid';

@Resolver()
export class FeedResolver {
  logger = new Logger(FeedResolver.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly feedService: FeedService,
    private readonly seenPostService: SeenPostService,
    private readonly sessionsService: SessionsService,
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
      this.logger.debug(`Paginating feed with date ${date} and score ${score}`);
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
      let searchResult: Feed[];
      [searchResult, postsCount] = await Promise.all([
        this.feedService.searchByTerm(
          searchTerm,
          tags,
          args.first,
          score,
          date,
        ),
        this.feedService.countBySearchTerm(searchTerm, tags, score, date),
      ]);
      feedPosts = searchResult.map(p => ({ ...p, score: p.searchScore }));
    } else {
      [feedPosts, postsCount] = await Promise.all([
        this.feedService.findSortedByScore(
          args.first,
          args.after && { maxScore: score, before: date },
          tags,
        ),
        this.feedService.countByScore(
          tags,
          args.after && {
            maxScore: score,
            before: date,
          },
        ),
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

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  async markPostAsSeen(
    @Args('post', { description: 'The post id.' }) post: string,
    @CurrentUser() user: TokenUser,
  ): Promise<string> {
    const [session] = await this.sessionsService.findByUser(user._id, true);
    if (!session)
      throw new ForbiddenException('No open session found for this user.');
    return this.seenPostService
      .create({
        _id: v4(),
        post,
        session: session._id,
      })
      .then(seenPost => seenPost._id);
  }
}
