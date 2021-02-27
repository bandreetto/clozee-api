import { MiddlewareConsumer, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import {
  TokenMiddleware,
  WebSocketTokenMiddleware,
} from './common/middlewares';
import configuration from './config/configuration';
import { CountersModule } from './counters/counters.module';
import { DeliveryModule } from './delivery/delivery.module';
import { FeedModule } from './feed/feed.module';
import { LikesModule } from './likes/likes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PostsModule } from './posts/posts.module';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot(configuration.database.url(), {
      useFindAndModify: false,
      useNewUrlParser: true,
      useCreateIndex: true,
    }),
    GraphQLModule.forRootAsync({
      imports: [AuthModule],
      useFactory: (jwtService: JwtService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        installSubscriptionHandlers: true,
        context: context => context,
        subscriptions: {
          onConnect: WebSocketTokenMiddleware(jwtService),
        },
      }),
      inject: [JwtService],
    }),
    EventEmitterModule.forRoot(),
    UsersModule,
    PostsModule,
    CommentsModule,
    FeedModule,
    AuthModule,
    CategoriesModule,
    OrdersModule,
    CountersModule,
    NotificationsModule,
    LikesModule,
    DeliveryModule,
    PaymentsModule,
    SessionsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes('graphql');
  }
}
