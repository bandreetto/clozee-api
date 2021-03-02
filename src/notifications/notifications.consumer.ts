import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { CommentCreatedPayload } from 'src/comments/contracts/payloads';
import { TAX_PERCENTAGE } from 'src/common/contants';
import { admin } from 'src/common/firebase-admin';
import { MenvController } from 'src/delivery/melhor-envio.controller';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';
import { OrdersService } from 'src/orders/orders.service';
import { Post } from 'src/posts/contracts';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { CommentsService } from '../comments/comments.service';
import { CommentTagNotification, SaleNotification } from './contracts';
import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsConsumer {
  logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly ordersService: OrdersService,
    private readonly menvController: MenvController,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @OnEvent('comment.created', { async: true })
  async createNotifications(payload: CommentCreatedPayload) {
    try {
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
      await Promise.all(
        createdNotifications.map(notification =>
          this.pubSub.publish('notification', {
            notification,
          }),
        ),
      );
    } catch (error) {
      this.logger.error({
        message: 'Error while sending comment.created notifications',
        payload,
        error: error.toString(),
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async sendCommentPushNotification(payload: CommentCreatedPayload) {
    try {
      const users = await this.usersService.findManyByIds([
        payload.comment.user as string,
        ...(payload.comment.tags as string[]),
      ]);
      const taggingUser = users.find(user => user._id === payload.comment.user);
      const taggedUsers = users.filter(
        u => u.deviceToken && u._id !== taggingUser._id,
      );
      if (!taggedUsers.length) return;
      await admin.messaging().sendMulticast({
        tokens: taggedUsers.map(u => u.deviceToken),
        notification: {
          title: `@${taggingUser.username} marcou você em um comentário`,
          body: payload.comment.body,
        },
        android: { priority: 'high' },
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while sending comment push notifications.',
        payload,
        error: error.toString(),
      });
    }
  }

  @OnEvent('order.created', { async: true })
  async sendOrderNotifications(payload: OrderCreatedPayload) {
    try {
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

      const subTotal = payload.posts.reduce((acc, post) => acc + post.price, 0);

      /**
       * Menv Delivery
       */

      const labelUrl = await this.menvController.getLabelURLForOrder(
        payload.order.deliveryInfo.menvDeliveryOrderId,
      );

      await this.ordersService.update(payload.order._id, {
        deliveryInfo: {
          ...payload.order.deliveryInfo,
          deliveryLabelUrl: labelUrl,
        },
      });

      /**
       * Emails
       */

      this.mailService.sendBuyerEmail(
        buyer,
        payload.order,
        payload.posts,
        subTotal,
        0,
        subTotal + payload.order.deliveryInfo.price,
      );

      const sellerTaxes = subTotal * TAX_PERCENTAGE;

      if (labelUrl) {
        this.mailService.sendSellerMail(
          seller,
          payload.order,
          payload.posts,
          subTotal,
          sellerTaxes,
          subTotal + payload.order.deliveryInfo.price + sellerTaxes,
          labelUrl,
        );
      }

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
    } catch (error) {
      this.logger.error({
        message: 'Error while sending order.created notifications',
        payload,
        error: error.toString(),
      });
    }
  }

  @OnEvent('post.deleted', { async: true })
  async deletePostCommentNotification(payload: Post) {
    try {
      const comments = await this.commentsService.findByPost(payload._id);
      await this.notificationsService.deleteCommentTagNotifications(
        comments.map(comment => comment._id),
      );
    } catch (error) {
      this.logger.error({
        message:
          'Error while deleting comments notification from post.deleted event.',
        payload,
        error: error.toString(),
      });
    }
  }
}
