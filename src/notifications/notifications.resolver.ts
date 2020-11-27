import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { AuthorizedConnectionContext, TokenUser } from 'src/common/types';
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
    const commentTags = payload.comment.tags as string[];
    const tagNotifications: CommentTagNotification[] = commentTags.map(
      userTagged => ({
        _id: v4(),
        kind: CommentTagNotification.name,
        comment: payload.comment._id,
        user: userTagged,
      }),
    );
    const createdNotifications = await this.notificationsService.createMany(
      tagNotifications,
    );
    createdNotifications.map(notification =>
      this.pubSub.publish('notification', {
        notification,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Subscription(() => Notification, {
    filter: (
      payload: { notification: Notification },
      _variables,
      connectionContext: AuthorizedConnectionContext,
    ) =>
      payload.notification.user ===
      connectionContext.connection.context.user._id,
  })
  notification() {
    return this.pubSub.asyncIterator('notification');
  }

  @UseGuards(AuthGuard)
  @Query(() => [Notification])
  notifications(@CurrentUser() tokenUser: TokenUser): Promise<Notification[]> {
    return this.notificationsService.findByUser(tokenUser._id);
  }
}
