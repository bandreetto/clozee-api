import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CategoriesService } from 'src/categories/categories.service';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { v4 } from 'uuid';
import { FeedService } from './feed.service';

const FEMALE_CATEGORY_ID = '9f09504e-9caa-43b5-b0fd-1c1da5d1606b';
const MALE_CATEGORY_ID = '572edcbc-189e-40a2-94a6-e17167c8bc8e';
@Injectable()
export class FeedConsumer {
  constructor(
    private readonly feedService: FeedService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @OnEvent('post.created')
  async handlePostCreated(payload: Post) {
    const categoryId =
      typeof payload.category === 'string'
        ? payload.category
        : payload.category._id;
    const [category, categoryAncestrals] = await Promise.all([
      this.categoriesService.findById(categoryId),
      this.categoriesService.findCategoryParents(categoryId),
    ]);
    const categoryAncestralsIds = categoryAncestrals.map(c => c._id);

    let gender: GENDER_TAGS;
    if (categoryAncestralsIds.includes(MALE_CATEGORY_ID))
      gender = GENDER_TAGS.MALE;
    else if (categoryAncestralsIds.includes(FEMALE_CATEGORY_ID))
      gender = GENDER_TAGS.FEMALE;
    else gender = GENDER_TAGS.NEUTRAL;

    return this.feedService.create({
      _id: v4(),
      post: payload._id,
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
  }

  @OnEvent('post.deleted')
  handlePostDeleted(payload: Post) {
    return this.feedService.deleteByPost(payload._id);
  }

  @OnEvent('order.created')
  handlePostSold(payload: OrderCreatedPayload) {
    return this.feedService.deleteManyByPosts(payload.posts.map(p => p._id));
  }
}
