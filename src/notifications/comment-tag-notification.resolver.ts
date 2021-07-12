import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CommentsLoader } from '../comments/comments.dataloader';
import { CommentTagNotification } from './contracts';
import { Comment } from '../comments/contracts';

@Resolver(() => CommentTagNotification)
export class CommentTagNotificationResolver {
  constructor(private readonly commentsLoader: CommentsLoader) {}

  @ResolveField()
  async comment(@Root() notification: CommentTagNotification): Promise<Comment> {
    if (typeof notification.comment !== 'string') return notification.comment;
    return this.commentsLoader.load(notification.comment);
  }
}
