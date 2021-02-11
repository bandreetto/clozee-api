import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { MailService } from './mail.service';
import { formatEmailCurrency } from './notifications.logic';

@Injectable()
export class NotificationsConsumer {
  logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
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

    /**
     * Graphql Subscription
     */
    createdNotifications.forEach(notification => {
      this.pubSub.publish('notification', {
        notification,
      });
    });

    /**
     * Push Notifications
     */
    const users = await this.usersService.findManyByIds([
      payload.comment.user as string,
      ...createdNotifications.map(n => n.user),
    ]);
    const taggingUser = users.find(user => user._id === payload.comment.user);
    await admin.messaging().sendMulticast({
      tokens: users
        .filter(u => createdNotifications.map(n => n.user).includes(u._id))
        .map(u => u.deviceToken),
      notification: {
        title: `@${taggingUser.username} marcou você em um comentário`,
        body: payload.comment.body,
      },
      android: { priority: 'high' },
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

    const seller = await this.usersService.findById(sellerId);
    const buyer = await this.usersService.findById(
      payload.order.buyer as string,
    );
    /**
     * Emails
     */
    const subTotal = payload.posts.reduce((acc, post) => acc + post.price, 0);
    this.mailService.sendSellerMail(
      seller,
      payload.order,
      payload.posts,
      subTotal,
      0,
      subTotal + payload.order.deliveryInfo.price,
    );
    this.mailService.sendBuyerEmail(
      buyer,
      payload.order,
      payload.posts,
      subTotal,
      0,
      subTotal + payload.order.deliveryInfo.price,
    );

    /**
     * Push Notifications
     */
    if (!seller.deviceToken)
      return this.logger.warn({
        message:
          'Skipping push notification as seller does not have a device token registered.',
        sellerId: seller._id,
        order: payload.order.number,
      });
    const fcmNotifications = payload.posts.map(post => ({
      token: seller.deviceToken,
      notification: {
        title: 'Parabéns! Você realizou uma venda!',
        body: `O post ${post.title} foi vendido!`,
      },
      android: {
        notification: {
          imageUrl: post.images[0],
        },
        priority: 'high' as const,
      },
    }));
    await admin.messaging().sendAll(fcmNotifications);
  }

  @OnEvent('post.deleted')
  async deletePostCommentNotification(payload: Post) {
    const comments = await this.commentsService.findByPost(payload._id);
    this.notificationsService.deleteCommentTagNotifications(
      comments.map(comment => comment._id),
    );
  }
}
