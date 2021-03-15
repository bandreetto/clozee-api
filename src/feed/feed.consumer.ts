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

const FEMALE_CATEGORY_ID = '9f09504e-9caa-43b5-b0fd-1c1da5d1606b';
const MALE_CATEGORY_ID = '572edcbc-189e-40a2-94a6-e17167c8bc8e';
@Injectable()
export class FeedConsumer {
  logger = new Logger(FeedConsumer.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly categoriesService: CategoriesService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly seenPostService: SeenPostService,
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
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async incrementCommentScore(payload: CommentCreatedPayload) {
    try {
      const feed = await this.feedService.findByPost(payload.post._id);
      await this.feedService.updateScore(feed._id, feed.score + 1);
    } catch (error) {
      this.logger.error({
        message:
          'Error while incrementing post score from comment.created event.',
        payload,
        error: error.toString(),
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
      });
    }
  }
}
