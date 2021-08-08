import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Post } from '../posts/contracts';
import { FeedService } from './feed.service';
import { CategoriesService } from '../categories/categories.service';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';
import { getFeedTags, getPostScore } from './feed.logic';
import { v4 } from 'uuid';
import { LikePayload } from '../likes/contracts/payloads';
import { CommentCreatedPayload } from '../comments/contracts/payloads';
import { OrderCreatedPayload } from '../orders/contracts/payloads';

@Injectable()
export class FeedConsumer {
  logger = new Logger(FeedConsumer.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly categoriesService: CategoriesService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('feed-post.created', { async: true })
  async createFeedPost(payload: Post) {
    try {
      const categoryId = typeof payload.category === 'string' ? payload.category : payload.category._id;
      const [category, categoryParents, [{ count: likesCount } = { count: 0 }], commentsCount] = await Promise.all([
        this.categoriesService.findById(categoryId),
        this.categoriesService.findCategoryParents(categoryId),
        this.likesService.countByPosts([payload._id]),
        this.commentsService.countByPost(payload._id),
      ]);
      const tags = getFeedTags(payload, category, categoryParents);
      const score = getPostScore(payload, likesCount, commentsCount);

      this.logger.debug(`Trying to create FeedPost for Post ${payload._id}`);
      const feed = await this.feedService.create({
        _id: v4(),
        post: payload._id,
        postOwner: typeof payload.user === 'string' ? payload.user : payload.user._id,
        score,
        tags,
        createdAt: payload.createdAt,
      });
      this.eventEmitter.emit('feed.created', feed);
      this.logger.log(`New feed created for post ${payload._id}`);
    } catch (error) {
      this.logger.error({
        message: 'Error while trying to create a FeedPost from the post.created event.',
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
        message: 'Error while trying to delete FeedPost from post.deleted event.',
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
        message: 'Error while incrementing post score from comment.created event.',
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
}
