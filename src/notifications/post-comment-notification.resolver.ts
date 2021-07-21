import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CommentsLoader } from '../comments/comments.dataloader';
import { PostCommentNotification } from './contracts';
import { Comment } from '../comments/contracts';
import { Post } from '../posts/contracts';
import { PostsLoader } from '../posts/posts.dataloader';

@Resolver(() => PostCommentNotification)
export class PostCommentNotificationResolver {
  constructor(private readonly commentsLoader: CommentsLoader, private readonly postsLoader: PostsLoader) {}

  @ResolveField()
  async comment(@Root() notification: PostCommentNotification): Promise<Comment> {
    if (typeof notification.comment !== 'string') return notification.comment;
    return this.commentsLoader.load(notification.comment);
  }

  @ResolveField()
  async post(@Root() notification: PostCommentNotification): Promise<Post> {
    if (typeof notification.post !== 'string') return notification.post;
    return this.postsLoader.load(notification.post);
  }
}
