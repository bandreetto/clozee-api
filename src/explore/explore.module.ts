import { Module } from '@nestjs/common';
import { CmsModule } from 'src/cms/cms.module';
import { LikesModule } from 'src/likes/likes.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { ExploreResolver } from './explore.resolver';

@Module({
  imports: [CmsModule, PostsModule, LikesModule, OrdersModule, UsersModule],
  providers: [ExploreResolver],
})
export class ExploreModule {}
