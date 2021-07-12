import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from '../categories/categories.module';
import { CommentsModule } from '../comments/comments.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { LikesModule } from '../likes/likes.module';
import { Post, PostSchema } from './contracts';
import { PostsLoader } from './posts.dataloader';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),
    CategoriesModule,
    forwardRef(() => UsersModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => LikesModule),
  ],
  providers: [PostsResolver, PostsService, PostsLoader],
  exports: [PostsService, PostsLoader],
})
export class PostsModule {}
