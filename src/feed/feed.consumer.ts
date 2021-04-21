import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoriesService } from 'src/categories/categories.service';
import { LikesService } from 'src/likes/likes.service';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { v4 } from 'uuid';
import { FeedService } from './feed.service';
import { CommentsService } from '../comments/comments.service';
import { LikePayload } from '../likes/contracts/payloads';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { SeenPostService } from './seen-post.service';
import { Session } from 'src/sessions/contracts';
import { BlockUserPayload } from '../users/contracts/payloads';
import { PostsService } from 'src/posts/posts.service';
import { FollowsService } from '../follows/follows.service';
import { Follow } from 'src/follows/contracts';
import { OrdersService } from 'src/orders/orders.service';
import { Feed } from './contracts';
import { getPostScore, getFeedTags } from './feed.logic';
import { Category } from 'src/categories/contracts';

const FOLLOWING_POINTS = 20;
@Injectable()
export class FeedConsumer {
  logger = new Logger(FeedConsumer.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly categoriesService: CategoriesService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly seenPostService: SeenPostService,
    private readonly postsService: PostsService,
    private readonly followsService: FollowsService,
    private readonly ordersService: OrdersService,
  ) {}

  @OnEvent('post.created', { async: true })
  async createFeedPost(payload: Post) {
    try {
      const categoryId =
        typeof payload.category === 'string'
          ? payload.category
          : payload.category._id;
      const postOwnerId =
        typeof payload.user === 'string' ? payload.user : payload.user._id;
      const [
        category,
        categoryParents,
        [{ count: likesCount } = { count: 0 }],
        commentsCount,
        follows,
      ] = await Promise.all([
        this.categoriesService.findById(categoryId),
        this.categoriesService.findCategoryParents(categoryId),
        this.likesService.countByPosts([payload._id]),
        this.commentsService.countByPost(payload._id),
        this.followsService.findManyByFollowees([postOwnerId]),
      ]);
      const tags = getFeedTags(payload, category, categoryParents);

      const score = getPostScore(payload, likesCount, commentsCount);

      const followingUsers = follows.map(f => f.follower);
      this.logger.debug(`Trying to create FeedPost for Post ${payload._id}`);
      await this.feedService.createManyPerUser(
        {
          _id: v4(),
          post: payload._id,
          score,
          tags,
          createdAt: payload.createdAt,
        },
        followingUsers,
        FOLLOWING_POINTS,
      );
      this.logger.log(`FeedPosts created for Post ${payload._id}`);
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to create a feedPost from the post.created event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('user.preSigned')
  async createFeedForUser(payload: string) {
    try {
      this.logger.debug(`Trying to create Feed for user ${payload}`);

      const [posts, follows] = await Promise.all([
        this.postsService.findAllNotDeleted(),
        this.followsService.findManyByFollowers([payload]),
      ]);
      const postsIds = posts.map(p => p._id);
      const categoriesIds = posts.map(p =>
        typeof p.category === 'string' ? p.category : p.category._id,
      );
      const [
        sales,
        postsLikes,
        postsComments,
        categories,
        categoriesParents,
      ] = await Promise.all([
        this.ordersService.findSalesByPosts(postsIds),
        this.likesService.countByPosts(postsIds),
        this.commentsService.countByPosts(postsIds),
        this.categoriesService.findManyByIds(categoriesIds),
        Promise.all<[string, Category[]]>(
          categoriesIds.map(async c => [
            c,
            await this.categoriesService.findCategoryParents(c),
          ]),
        ),
      ]);
      const notSoldPosts = posts.filter(
        p => !sales.map(s => s?.post).includes(p._id),
      );

      const feeds: Feed[] = notSoldPosts.map(post => {
        const category = categories.find(c => c._id === post.category);
        const [_categoryId, parentCategories] = categoriesParents.find(
          ([categoryId, _parents]) => categoryId === category._id,
        );
        const { count: likes } = postsLikes.find(
          postLikes => postLikes._id === post._id,
        ) || { count: 0 };
        const { count: comments = 0 } = postsComments.find(
          postComments => postComments._id === post._id,
        ) || { count: 0 };

        return {
          _id: `${v4()}:${payload}`,
          post: post._id,
          score: getPostScore(
            post,
            likes,
            comments,
            follows.map(f => f.followee),
          ),
          tags: getFeedTags(post, category, parentCategories),
          user: payload,
          createdAt: post.createdAt,
        };
      });

      await this.feedService.createMany(feeds);
      this.logger.log(`New feed generated for user ${payload}`);
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to generate new feed for user after pre-sign.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('post.deleted', { async: true })
  async deleteFeedPost(payload: Post) {
    try {
      await this.feedService.deleteByPost(payload._id);
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to delete FeedPost from post.deleted event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('post.liked', { async: true })
  async incrementLikeScore(payload: LikePayload) {
    try {
      await this.feedService.addToScoreByPost(1, payload.post);
    } catch (error) {
      this.logger.error({
        message: 'Error while incrementing post score from post.liked event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('post.unliked', { async: true })
  async decrementLikeScore(payload: LikePayload) {
    try {
      await this.feedService.addToScoreByPost(-1, payload.post);
    } catch (error) {
      this.logger.error({
        message: 'Error while decrementing post score from post.unliked event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async incrementCommentScore(payload: CommentCreatedPayload) {
    try {
      await this.feedService.addToScoreByPost(1, payload.post._id);
    } catch (error) {
      this.logger.error({
        message:
          'Error while incrementing post score from comment.created event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('order.created', { async: true })
  async deleteSoldPostFromFeed(payload: OrderCreatedPayload) {
    try {
      await this.feedService.deleteManyByPosts(payload.posts.map(p => p._id));
    } catch (error) {
      this.logger.error({
        message: 'Error while deleting FeedPost from order.created event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('session.terminated', { async: true })
  async addSeenPostsToBlacklist(payload: Session) {
    try {
      this.logger.log(
        `Blacklisting posts from session ${payload._id} of user ${payload.user}`,
      );
      await this.seenPostService.mergeSessionPostsToBlacklist(
        payload._id,
        payload.user,
      );
    } catch (error) {
      this.logger.error({
        message: 'Error while merging session seen posts to blacklist.',
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('feed.endReached', { async: true })
  async clearBlacklist(payload: string) {
    try {
      this.logger.log(`Clearing user ${payload} blacklist.`);
      return this.seenPostService.clearBlacklist(payload);
    } catch (error) {
      this.logger.error({
        message: `Could not clear user ${payload} blacklist.`,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('user.blocked', { async: true })
  async addBlockedUsersToBlacklist(payload: BlockUserPayload) {
    try {
      const blockedUserPosts = await this.postsService.findManyByUser(
        payload.blockedUserId,
      );
      const blockedUserPostsIds = blockedUserPosts.map(p => p._id);
      return this.seenPostService.addToBlockedUserPosts(
        payload.blockingUser._id,
        blockedUserPostsIds,
      );
    } catch (error) {
      this.logger.error({
        message: 'Could not blacklist blocked user posts.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('follow.created', { async: true })
  async increaseFollowedUserPostsScore(payload: Follow) {
    console.log('follow');
    try {
      const followeePosts = await this.postsService.findManyByUser(
        payload.followee,
      );
      const feeds = await this.feedService.findByPosts(
        followeePosts.map(p => p._id),
        payload.follower,
      );
      await this.feedService.addToScores(
        FOLLOWING_POINTS,
        feeds.map(f => f._id),
      );
    } catch (error) {
      this.logger.error({
        message: 'Could not increase post score after following',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('follow.deleted', { async: true })
  async decreaseUnfollowedUserPostsScore(payload: Follow) {
    console.log('unfollow');
    try {
      const followeePosts = await this.postsService.findManyByUser(
        payload.followee,
      );
      const feeds = await this.feedService.findByPosts(
        followeePosts.map(p => p._id),
        payload.follower,
      );
      await this.feedService.addToScores(
        -FOLLOWING_POINTS,
        feeds.map(f => f._id),
      );
    } catch (error) {
      this.logger.error({
        message: 'Could not decrease post score after unfollowing',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
