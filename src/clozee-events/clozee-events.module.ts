import { Module } from '@nestjs/common';
import { PostsModule } from 'src/posts/posts.module';
import { ClozeeEventsResolver } from './clozee-events.resolver';

@Module({
  imports: [PostsModule],
  providers: [ClozeeEventsResolver],
})
export class ClozeeEventsModule {}
