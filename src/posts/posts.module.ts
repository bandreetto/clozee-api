import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsModule } from 'src/comments/comments.module';
import { UsersModule } from 'src/users/users.module';
import { Post, PostSchema } from './contracts/domain';
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
    forwardRef(() => UsersModule),
    forwardRef(() => CommentsModule),
  ],
  providers: [PostsService, PostsResolver],
  exports: [PostsService],
})
export class PostsModule {}
