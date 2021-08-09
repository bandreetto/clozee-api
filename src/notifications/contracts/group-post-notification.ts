import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Group } from 'src/groups/contracts';
import { User } from 'src/users/contracts';
import { Notification } from '.';

@Schema()
@ObjectType({
  implements: () => [Notification],
})
export class GroupPostNotification implements Notification {
  _id: string;
  kind: string;
  unseen: boolean;
  user: string;
  createdAt?: Date;

  @Prop({ type: String, required: true })
  @Field(() => Group, {
    description: 'The group that the post was added to.',
  })
  group: string | Group;

  @Prop({ type: String, required: true })
  @Field(() => User, {
    description: 'Owner of the post.',
  })
  postOwner: string | User;
}

export const GroupPostNotificationSchema = SchemaFactory.createForClass(GroupPostNotification);
