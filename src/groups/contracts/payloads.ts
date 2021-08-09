import { TokenUser } from 'src/common/types';
import { Group } from '.';

export interface GroupCreatedPayload {
  group: Group;
  participants: string[];
  groupCreator: TokenUser;
}
