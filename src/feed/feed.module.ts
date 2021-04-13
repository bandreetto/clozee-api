import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from 'src/categories/categories.module';
import { CommentsModule } from 'src/comments/comments.module';
import { LikesModule } from 'src/likes/likes.module';
import { PostsModule } from 'src/posts/posts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { FollowsModule } from '../follows/follows.module';
import { Feed, FeedSchema } from './contracts';
import { SeenPost, SeenPostSchema } from './contracts/seen-post';
import { PostBlacklist, PostBlacklistSchema } from './contracts/post-blacklist';
import { FeedConsumer } from './feed.consumer';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';
import { SeenPostService } from './seen-post.service';
import { User, UserSchema } from 'src/users/contracts';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Feed.name,
        schema: FeedSchema,
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
       * User model is injected here to efficiently create a feed post for every user. In the future, when feeds have its own service with its own database,
       * this could only be a reference to a mirrored users table on feeds service's database (by following the Saga pattern: https://microservices.io/patterns/data/saga.html),
       * but as of today feed and users share the same DB so no need to mirror the users collection.
       *
       * This module SHOULD NOT write on users database.
       */
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    PostsModule,
    CategoriesModule,
    LikesModule,
    CommentsModule,
    SessionsModule,
    FollowsModule,
  ],
  providers: [FeedResolver, FeedService, FeedConsumer, SeenPostService],
})
export class FeedModule {}
