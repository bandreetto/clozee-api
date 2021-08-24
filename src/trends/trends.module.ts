import { Module } from '@nestjs/common';
import { CmsModule } from 'src/cms/cms.module';
import { UsersModule } from 'src/users/users.module';
import { TrendsResolver } from './trends.resolver';

@Module({
  imports: [UsersModule, CmsModule],
  providers: [TrendsResolver],
})
export class TrendsModule {}
