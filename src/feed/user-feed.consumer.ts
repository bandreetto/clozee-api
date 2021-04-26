import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { UserFeedService } from './user-feed.service';
import { LikePayload } from '../likes/contracts/payloads';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { SeenPostService } from './seen-post.service';
import { Session } from 'src/sessions/contracts';
import { BlockUserPayload } from '../users/contracts/payloads';
import { PostsService } from 'src/posts/posts.service';
import { FollowsService } from '../follows/follows.service';
import { Follow } from 'src/follows/contracts';
import { Feed } from './contracts';

const FOLLOWING_POINTS = 20;
@Injectable()
export class UserFeedConsumer {
  logger = new Logger(UserFeedConsumer.name);

  constructor(
    private readonly userFeedService: UserFeedService,
    private readonly seenPostService: SeenPostService,
    private readonly postsService: PostsService,
    private readonly followsService: FollowsService,
  ) {}

  @OnEvent('feed.created', { async: true })
  async createUserFeedPost(payload: Feed) {
    try {
      const follows = await this.followsService.findManyByFollowees([
        payload.postOwner,
      ]);

      const followingUsers = follows.map(f => f.follower);
      this.logger.debug(
        `Trying to create UserFeedPosts for Post ${payload._id}`,
      );

      await this.userFeedService.createManyPerUser(
        {
          post: payload.post,
          score: payload.score,
          tags: payload.tags,
          createdAt: payload.createdAt,
        },
        followingUsers,
        FOLLOWING_POINTS,
      );
      this.logger.log(`UserFeedPosts created for Post ${payload._id}`);
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to create a UserFeedPost from the post.created event.',
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

      const follows = await this.followsService.findManyByFollowers([payload]);
      const followees = follows.map(f => f.followee);
      await this.userFeedService.createManyPerFeed(
        payload,
        followees,
        FOLLOWING_POINTS,
      );
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
      await this.userFeedService.deleteByPost(payload._id);
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
      await this.userFeedService.addToScoreByPost(1, payload.post);
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
      await this.userFeedService.addToScoreByPost(-1, payload.post);
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
      await this.userFeedService.addToScoreByPost(1, payload.post._id);
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
      await this.userFeedService.deleteManyByPosts(
        payload.posts.map(p => p._id),
      );
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
      const feeds = await this.userFeedService.findByPosts(
        followeePosts.map(p => p._id),
        payload.follower,
      );
      await this.userFeedService.addToScores(
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
      const feeds = await this.userFeedService.findByPosts(
        followeePosts.map(p => p._id),
        payload.follower,
      );
      await this.userFeedService.addToScores(
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
