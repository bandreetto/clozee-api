import { TokenUser } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { Comment } from '.';

export class CommentCreatedPayload {
  comment: Comment;
  post: Post;
  user: TokenUser;
}
