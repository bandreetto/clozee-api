import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CommentsLoader } from 'src/comments/comments.dataloader';
import { PostsLoader } from 'src/posts/posts.dataloader';
import { CommentTagNotification } from './contracts';
import { Post } from 'src/posts/contracts';
import { Comment } from 'src/comments/contracts';

@Resolver(() => CommentTagNotification)
export class CommentTagNotificationResolver {
  constructor(
    private readonly commentsLoader: CommentsLoader,
    private readonly postsLoader: PostsLoader,
  ) {}

  @ResolveField()
  async comment(
    @Root() notification: CommentTagNotification,
  ): Promise<Comment> {
    if (typeof notification.comment !== 'string') return notification.comment;
    return this.commentsLoader.load(notification.comment);
  }

  @ResolveField()
  async post(@Root() notification: CommentTagNotification): Promise<Post> {
    if (typeof notification.post !== 'string') return notification.post;
    return this.postsLoader.load(notification.post);
  }
}
