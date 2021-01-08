import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { Post } from 'src/posts/contracts';
import { v4 } from 'uuid';
import { CommentTagNotification, SaleNotification } from './contracts';
import { NotificationsService } from './notifications.service';
import { CommentsService } from '../comments/comments.service';
import { admin } from 'src/common/firebase-admin';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
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
        unseen: true,
      }),
    );
    const createdNotifications = await this.notificationsService.createMany(
      tagNotifications,
    );
    const users = await this.usersService.findManyByIds([
      payload.comment.user as string,
      ...createdNotifications.map(t => t.user),
    ]);
    const taggingUser = users.find(user => user._id === payload.comment.user);

    createdNotifications.map(notification => {
      this.pubSub.publish('notification', {
        notification,
      });

      const taggedUser = users.find(user => user._id === notification.user);
      admin.messaging().sendToDevice(taggedUser.deviceToken, {
        notification: {
          title: `@${taggingUser.username} marcou você em um comentário`,
          body: payload.comment.body,
        },
      });
    });
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedPayload) {
    const sellerId = payload.posts[0].user as string;
    const notification: SaleNotification = {
      _id: v4(),
      kind: SaleNotification.name,
      user: sellerId,
      order: payload.order._id,
      unseen: true,
    };
    const createdNotification = await this.notificationsService.create(
      notification,
    );
    /**
     * Graphql Subscription
     */
    this.pubSub.publish('notification', {
      notification: createdNotification,
    });

    /**
     * Push Notifications
     */
    const seller = await this.usersService.findById(sellerId);
    await admin.messaging().sendAll(
      payload.posts.map(post => ({
        token: seller.deviceToken,
        notification: {
          title: 'Parabéns! Você realizou uma venda!',
          body: `O post ${post.title} foi vendido!`,
        },
        android: {
          notification: {
            imageUrl: post.images[0],
          },
        },
      })),
    );
  }

  @OnEvent('post.deleted')
  async deletePostCommentNotification(payload: Post) {
    const comments = await this.commentsService.findByPost(payload._id);
    this.notificationsService.deleteCommentTagNotifications(
      comments.map(comment => comment._id),
    );
  }
}
