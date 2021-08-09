import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsModule } from '../comments/comments.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { PostsModule } from '../posts/posts.module';
import { FollowsModule } from '../follows/follows.module';
import { CommentTagNotificationResolver } from './comment-tag-notification.resolver';
import {
  CommentTagNotification,
  CommentTagNotificationSchema,
  GroupInviteNotification,
  GroupInviteNotificationSchema,
  GroupPostNotification,
  GroupPostNotificationSchema,
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
import configuration from '../config/configuration';
import { LikesModule } from '../likes/likes.module';
import { NotificationTasks } from './notifications.tasks';
import { GroupInviteNotificationResolver } from './group-invite-notification.resolver';
import { GroupsModule } from 'src/groups/groups.module';
import { GroupPostNotificationResolver } from './group-post-notification.resolver';

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
          {
            name: GroupInviteNotification.name,
            schema: GroupInviteNotificationSchema,
          },
          {
            name: GroupPostNotification.name,
            schema: GroupPostNotificationSchema,
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
    FollowsModule,
    LikesModule,
    GroupsModule,
  ],
  providers: [
    NotificationsResolver,
    CommentTagNotificationResolver,
    SaleNotificationResolver,
    NotificationsService,
    NotificationsConsumer,
    PostCommentNotificationResolver,
    GroupInviteNotificationResolver,
    GroupPostNotificationResolver,
    NotificationTasks,
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
