import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from '../categories/categories.module';
import { PostsModule } from '../posts/posts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { FollowsModule } from '../follows/follows.module';
import { OrdersModule } from '../orders/orders.module';
import { Feed, FeedSchema, UserFeed, UserFeedSchema } from './contracts';
import { SeenPost, SeenPostSchema } from './contracts/seen-post';
import { PostBlacklist, PostBlacklistSchema } from './contracts/post-blacklist';
import { UserFeedConsumer } from './user-feed.consumer';
import { FeedResolver } from './feed.resolver';
import { SeenPostService } from './seen-post.service';
import { User, UserSchema } from '../users/contracts';
import { UserFeedService } from './user-feed.service';
import { FeedService } from './feed.service';
import { FeedConsumer } from './feed.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Feed.name,
        schema: FeedSchema,
      },
      {
        name: UserFeed.name,
        schema: UserFeedSchema,
      },
      {
        name: SeenPost.name,
        schema: SeenPostSchema,
      },
      {
        name: PostBlacklist.name,
        schema: PostBlacklistSchema,
      },
      /**
       * User and Post models are injected here to efficiently create feed posts for every user. In the future, when feeds have its own service with its own database,
       * this could only be a reference to a mirrored these tables on feeds service's database (by following the Saga pattern: https://microservices.io/patterns/data/saga.html),
       * but as of today feed and these models share the same DB so no need to mirror the users collection.
       *
       * This module SHOULD NOT write on these collection.
       */
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    PostsModule,
    CategoriesModule,
    SessionsModule,
    FollowsModule,
    OrdersModule,
  ],
  providers: [FeedResolver, UserFeedService, UserFeedConsumer, SeenPostService, FeedService, FeedConsumer],
})
export class FeedModule {}
