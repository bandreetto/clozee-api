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
          'Error while tring to create a feedPost from the post.created event',
        payload,
        error: error.toString(),
      });
    }
  }

  @OnEvent('post.deleted')
  handlePostDeleted(payload: Post) {
    return this.feedService.deleteByPost(payload._id);
  }

  @OnEvent('post.liked')
  async incrementLikeScore(payload: LikePayload) {
    const feed = await this.feedService.findByPost(payload.post);
    return this.feedService.updateScore(feed._id, feed.score + 1);
  }

  @OnEvent('post.unliked')
  async decrementeLikeScore(payload: LikePayload) {
    const feed = await this.feedService.findByPost(payload.post);
    return this.feedService.updateScore(feed._id, feed.score - 1);
  }

  @OnEvent('comment.created')
  async incrementCommentScore(payload: CommentCreatedPayload) {
    const feed = await this.feedService.findByPost(payload.post._id);
    return this.feedService.updateScore(feed._id, feed.score + 1);
  }

  @OnEvent('order.created')
  handlePostSold(payload: OrderCreatedPayload) {
    return this.feedService.deleteManyByPosts(payload.posts.map(p => p._id));
  }
}
