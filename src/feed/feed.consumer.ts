import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Post } from 'src/posts/contracts';
import { FeedService } from './feed.service';
import { CategoriesService } from 'src/categories/categories.service';
import { LikesService } from 'src/likes/likes.service';
import { CommentsService } from '../comments/comments.service';
import { getFeedTags, getPostScore } from './feed.logic';
import { v4 } from 'uuid';

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

  @OnEvent('post.created', { async: true })
  async createFeedPost(payload: Post) {
    try {
      const categoryId =
        typeof payload.category === 'string'
          ? payload.category
          : payload.category._id;
      const [
        category,
        categoryParents,
        [{ count: likesCount } = { count: 0 }],
        commentsCount,
      ] = await Promise.all([
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
        score,
        tags,
        createdAt: payload.createdAt,
      });
      this.eventEmitter.emit('feed.created', feed);
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to create a FeedPost from the post.created event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
