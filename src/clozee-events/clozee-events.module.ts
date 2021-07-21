import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { PostsModule } from '../posts/posts.module';
import { ClozeeEventsResolver } from './clozee-events.resolver';

@Module({
  imports: [PostsModule, CmsModule],
  providers: [ClozeeEventsResolver],
})
export class ClozeeEventsModule {}
