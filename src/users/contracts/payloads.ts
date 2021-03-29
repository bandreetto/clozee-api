import { User } from '.';

export interface BlockUserPayload {
  blockingUser: User;
  blockedUserId: string;
}
