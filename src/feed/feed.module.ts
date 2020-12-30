import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from 'src/posts/posts.module';
import { Feed, FeedSchema } from './contracts';
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
  ],
  providers: [FeedResolver, FeedService],
})
export class FeedModule {}
