import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Group } from 'src/groups/contracts';
import { User } from 'src/users/contracts';
import { Notification } from '.';

@Schema()
@ObjectType({
  implements: () => [Notification],
})
export class GroupInviteNotification implements Notification {
  _id: string;
  kind: string;
  unseen: boolean;
  user: string;
  createdAt?: Date;

  @Prop({ required: true })
  @Field(() => Group, {
    description: 'The group the user was added to.',
  })
  group: string | Group;

  @Prop({ required: true })
  @Field(() => User, {
    description: 'User who sent the invitation.',
  })
  inviter: string | User;
}

export const GroupInviteNotificationSchema = SchemaFactory.createForClass(GroupInviteNotification);
