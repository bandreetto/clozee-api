import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { v4 } from 'uuid';
import { FeedService } from './feed.service';

@Injectable()
export class FeedConsumer {
  constructor(private readonly feedService: FeedService) {}

  @OnEvent('post.created')
  handlePostCreated(payload: Post) {
    return this.feedService.create({
      _id: v4(),
      post: payload._id,
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
