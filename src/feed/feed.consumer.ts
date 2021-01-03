import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Post } from 'src/posts/contracts';
import { v4 } from 'uuid';
import { FeedService } from './feed.service';

@Injectable()
export class FeedConsumer {
  constructor(private readonly feedService: FeedService) {}

  @OnEvent('post.created')
  handlePostCreated(post: Post) {
    return this.feedService.create({
      _id: v4(),
      post: post._id,
    });
  }
}
