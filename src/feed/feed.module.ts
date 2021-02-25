import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from 'src/categories/categories.module';
import { CommentsModule } from 'src/comments/comments.module';
import { LikesModule } from 'src/likes/likes.module';
import { PostsModule } from 'src/posts/posts.module';
import { Feed, FeedSchema } from './contracts';
import { FeedConsumer } from './feed.consumer';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Feed.name,
        schema: FeedSchema,
      },
    ]),
    PostsModule,
    CategoriesModule,
    LikesModule,
    CommentsModule,
  ],
  providers: [FeedResolver, FeedService, FeedConsumer],
})
export class FeedModule {}
