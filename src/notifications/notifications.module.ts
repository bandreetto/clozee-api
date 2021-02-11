import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { CommentsModule } from 'src/comments/comments.module';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { CommentTagNotificationResolver } from './comment-tag-notification.resolver';
import {
  CommentTagNotification,
  CommentTagNotificationSchema,
  Notification,
  NotificationSchema,
  SaleNotification,
  SaleNotificationSchema,
} from './contracts';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';
import { SaleNotificationResolver } from './sale-notification.resolver';
import { MailService } from './mail.service';

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
        ],
      },
    ]),
    CommentsModule,
    OrdersModule,
    UsersModule,
  ],
  providers: [
    NotificationsResolver,
    CommentTagNotificationResolver,
    SaleNotificationResolver,
    NotificationsService,
    NotificationsConsumer,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    MailService,
  ],
})
export class NotificationsModule {}
