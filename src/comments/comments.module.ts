import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { CommentsResolver } from './resolvers/comments.resolver';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './contracts/domain';
import { CommentTag, CommentTagSchema } from './contracts/domain/comment-tag';
import { CommentTagResolver } from './resolvers/comment-tag.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
      {
        name: CommentTag.name,
        schema: CommentTagSchema,
      },
    ]),
    forwardRef(() => PostsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [CommentsResolver, CommentsService, CommentTagResolver],
  exports: [CommentsService],
})
export class CommentsModule {}
