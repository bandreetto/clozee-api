import { Module } from '@nestjs/common';
import { PostsModule } from 'src/posts/posts.module';
import { FeedResolver } from './feed.resolver';

@Module({
  imports: [PostsModule],
  providers: [FeedResolver]
})
export class FeedModule {}
