import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsModule } from 'src/comments/comments.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { PostsModule } from '../posts/posts.module';
import { CommentTagNotificationResolver } from './comment-tag-notification.resolver';
import {
  CommentTagNotification,
  CommentTagNotificationSchema,
  Notification,
  NotificationSchema,
  PostComentNotificationSchema,
  PostCommentNotification,
  SaleNotification,
  SaleNotificationSchema,
} from './contracts';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { SaleNotificationResolver } from './sale-notification.resolver';
import { PostCommentNotificationResolver } from './post-comment-notification.resolver';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import configuration from 'src/config/configuration';
import { PubSub } from 'graphql-subscriptions';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
        discriminators: [
          {
            name: CommentTagNotification.name,
            schema: CommentTagNotificationSchema,
          },
          {
            name: SaleNotification.name,
            schema: SaleNotificationSchema,
          },
          {
            name: PostCommentNotification.name,
            schema: PostComentNotificationSchema,
          },
        ],
      },
    ]),
    CommentsModule,
    OrdersModule,
    UsersModule,
    DeliveryModule,
    AuthModule,
    MailerModule,
    PostsModule,
  ],
  providers: [
    NotificationsResolver,
    CommentTagNotificationResolver,
    SaleNotificationResolver,
    NotificationsService,
    NotificationsConsumer,
    PostCommentNotificationResolver,
    {
      provide: 'PUB_SUB',
      useValue: new RedisPubSub({
        publisher: new Redis(configuration.redis.url()),
        subscriber: new Redis(configuration.redis.url()),
      }),
    },
  ],
})
export class NotificationsModule {}
