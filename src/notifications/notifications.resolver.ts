import { Inject, UseGuards } from '@nestjs/common';
import { Int, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { AuthorizedConnectionContext, TokenUser } from 'src/common/types';
import { Notification, SaleNotification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PubSub } from 'graphql-subscriptions';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { CommentTagNotification } from './contracts';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 } from 'uuid';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { CommentsService } from 'src/comments/comments.service';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
    private readonly commentsService: CommentsService,
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
        unseen: true,
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

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedPayload) {
    const seller = payload.posts[0].user as string;
    const notification: SaleNotification = {
      _id: v4(),
      kind: SaleNotification.name,
      user: seller,
      order: payload.order._id,
      unseen: true,
    };
    const createdNotification = await this.notificationsService.create(
      notification,
    );
    this.pubSub.publish('notification', {
      notification: createdNotification,
    });
  }

  @OnEvent('post.deleted')
  async deletePostCommentNotification(payload: Post) {
    const comments = await this.commentsService.findByPost(payload._id);
    this.notificationsService.deleteCommentTagNotifications(
      comments.map(comment => comment._id),
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

  @UseGuards(AuthGuard)
  @Mutation(() => [Notification], {
    description: 'Mark all user notifications as seen.',
  })
  async clearNotifications(
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Notification[]> {
    await this.notificationsService.updateManyByUser(tokenUser._id, {
      unseen: false,
    });

    return this.notificationsService.findByUser(tokenUser._id);
  }
}
