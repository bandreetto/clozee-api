import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Post } from '../posts/contracts';
import { FeedService } from './feed.service';
import { CategoriesService } from '../categories/categories.service';
import { getFeedTags, getPostScore } from './feed.logic';
import { v4 } from 'uuid';
import { OrderCreatedPayload } from '../orders/contracts/payloads';

@Injectable()
export class FeedConsumer {
  logger = new Logger(FeedConsumer.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly categoriesService: CategoriesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('feed-post.created', { async: true })
  async createFeedPost(payload: Post) {
    try {
      const categoryId = typeof payload.category === 'string' ? payload.category : payload.category._id;
      const [category, categoryParents] = await Promise.all([
        this.categoriesService.findById(categoryId),
        this.categoriesService.findCategoryParents(categoryId),
      ]);
      const tags = getFeedTags(payload, category, categoryParents);
      const score = getPostScore(payload._id);

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
