import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from 'src/categories/categories.module';
import { CommentsModule } from 'src/comments/comments.module';
import { LikesModule } from 'src/likes/likes.module';
import { PostsModule } from 'src/posts/posts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { Feed, FeedSchema } from './contracts';
import { SeenPost, SeenPostSchema } from './contracts/seen-post';
import { PostBlacklist, PostBlacklistSchema } from './contracts/post-blacklist';
import { FeedConsumer } from './feed.consumer';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';
import { SeenPostService } from './seen-post.service';

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
    ]),
    PostsModule,
    CategoriesModule,
    LikesModule,
    CommentsModule,
    SessionsModule,
  ],
  providers: [FeedResolver, FeedService, FeedConsumer, SeenPostService],
})
export class FeedModule {}
