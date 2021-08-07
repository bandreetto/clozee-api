import { Field, ObjectType } from '@nestjs/graphql';
import { Group } from 'src/groups/contracts';
import { User } from 'src/users/contracts';
import { Notification } from '.';

@ObjectType({
  implements: () => [Notification],
})
export class GroupPostNotification implements Notification {
  _id: string;
  kind: string;
  unseen: boolean;
  user: string;
  createdAt?: Date;

  @Field(() => Group, {
    description: 'The group that the post was added to.',
  })
  group: Group;

  @Field(() => User, {
    description: 'Owner of the post.',
  })
  postOwner: User;
}
