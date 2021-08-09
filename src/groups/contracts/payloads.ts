import { TokenUser } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { Group } from '.';

export interface GroupCreatedPayload {
  group: Group;
  participants: string[];
  groupCreator: TokenUser;
}

export interface GroupPostCreatedPayload {
  group: Group;
  post: Post;
  postOwner: TokenUser;
}
