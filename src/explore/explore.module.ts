import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { LikesModule } from '../likes/likes.module';
import { OrdersModule } from '../orders/orders.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { ExploreResolver } from './explore.resolver';

@Module({
  imports: [CmsModule, PostsModule, LikesModule, OrdersModule, UsersModule],
  providers: [ExploreResolver],
})
export class ExploreModule {}
