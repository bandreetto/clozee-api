import { Inject, UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { Notification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PubSub } from 'graphql-subscriptions';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { CommentTagNotification } from './contracts';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 } from 'uuid';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @OnEvent('comment.created')
  async handleCommentCreated(payload: CommentCreatedPayload) {
    if (!payload.comment.tags.length) return;
    const tagNotification: CommentTagNotification = {
      _id: v4(),
      kind: CommentTagNotification.name,
      comment: payload.comment._id,
      post: payload.post._id,
      user: payload.user._id,
    };
    const createdNotification = await this.notificationsService.createNotification(
      tagNotification,
    );
    this.pubSub.publish('notification', { notification: createdNotification });
  }

  @Subscription(() => Notification, {
    filter: (
      payload: { notification: Notification },
      variables: { user: string },
    ) => payload.notification.user === variables.user,
  })
  notification(
    @Args('user', { description: 'The id of the user.' }) _user: string,
  ) {
    return this.pubSub.asyncIterator('notification');
  }

  @UseGuards(AuthGuard)
  @Query(() => [Notification])
  notifications(@CurrentUser() tokenUser: TokenUser): Promise<Notification[]> {
    return this.notificationsService.findByUser(tokenUser._id);
  }
}
