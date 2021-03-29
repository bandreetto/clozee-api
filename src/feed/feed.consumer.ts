import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoriesService } from 'src/categories/categories.service';
import { LikesService } from 'src/likes/likes.service';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { v4 } from 'uuid';
import { FeedService } from './feed.service';
import { CommentsService } from '../comments/comments.service';
import { LikePayload } from '../likes/contracts/payloads';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { SeenPostService } from './seen-post.service';
import { Session } from 'src/sessions/contracts';
import { BlockUserPayload } from '../users/contracts/payloads';
import { PostsService } from 'src/posts/posts.service';

const FEMALE_CATEGORY_ID = 'b6877a2b-163b-4099-958a-17d74604ceed';
const MALE_CATEGORY_ID = '1b7f9f9d-ab18-4597-ab94-4dc19968208a';
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
  ) {}

  @OnEvent('post.created', { async: true })
  async createFeedPost(payload: Post) {
    try {
      const categoryId =
        typeof payload.category === 'string'
          ? payload.category
          : payload.category._id;
      const [
        category,
        categoryAncestrals,
        [{ count: likesCount } = { count: 0 }],
        comments,
      ] = await Promise.all([
        this.categoriesService.findById(categoryId),
        this.categoriesService.findCategoryParents(categoryId),
        this.likesService.countByPosts([payload._id]),
        this.commentsService.countByPost(payload._id),
      ]);
      const categoryAncestralsIds = categoryAncestrals.map(c => c._id);

      let gender: GENDER_TAGS;
      if (categoryAncestralsIds.includes(MALE_CATEGORY_ID))
        gender = GENDER_TAGS.MALE;
      else if (categoryAncestralsIds.includes(FEMALE_CATEGORY_ID))
        gender = GENDER_TAGS.FEMALE;
      else gender = GENDER_TAGS.NEUTRAL;

      const score = likesCount + comments;

      this.logger.debug(`Trying to create FeedPost for Post ${payload._id}`);
      await this.feedService.create({
        _id: v4(),
        post: payload._id,
        score,
        tags: {
          size: payload.size,
          gender,
          searchTerms: [
            payload.title,
            payload.description,
            category.name,
            ...categoryAncestrals.map(c => c.name),
          ],
        },
      });
      this.logger.log(`FeedPost created for Post ${payload._id}`);
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
      const feed = await this.feedService.findByPost(payload.post);
      await this.feedService.updateScore(feed._id, feed.score + 1);
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
  async decrementeLikeScore(payload: LikePayload) {
    try {
      const feed = await this.feedService.findByPost(payload.post);
      await this.feedService.updateScore(feed._id, feed.score - 1);
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
      const feed = await this.feedService.findByPost(payload.post._id);
      if (!feed) return;
      await this.feedService.updateScore(feed._id, feed.score + 1);
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
}
