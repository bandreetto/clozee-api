import { Module } from '@nestjs/common';
import { CmsModule } from 'src/cms/cms.module';
import { ExploreResolver } from './explore.resolver';

@Module({
  imports: [CmsModule],
  providers: [ExploreResolver],
})
export class ExploreModule {}
