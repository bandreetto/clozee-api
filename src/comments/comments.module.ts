import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { CommentsLoader } from './comments.dataloader';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './contracts';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
    forwardRef(() => PostsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [CommentsResolver, CommentsService, CommentsLoader],
  exports: [CommentsService, CommentsLoader],
})
export class CommentsModule {}
