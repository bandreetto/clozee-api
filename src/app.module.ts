import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { FeedModule } from './feed/feed.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { TokenMiddleware } from './common/middlewares';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CountersModule } from './counters/counters.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtService } from '@nestjs/jwt';
import { Token } from './auth/contracts';
import { isAccessToken } from './auth/auth.logic';

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
        context: ({ req, res, payload, connection }) => ({
          req,
          res,
          payload,
          connection,
        }),
        subscriptions: {
          onConnect: async (connectionParams: any) => {
            const token = connectionParams.authToken;
            if (!token) return {};
            return jwtService
              .verifyAsync<Token>(token, {
                complete: true,
              })
              .then(decoded => {
                if (!isAccessToken(decoded)) return {};
                return {
                  user: {
                    _id: decoded.payload.sub,
                    username: decoded.payload.username,
                  },
                };
              });
          },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenMiddleware).forRoutes('graphql');
  }
}
