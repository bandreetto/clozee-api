export * from './group-participant';
export * from './group-post';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from '../../posts/contracts';
import { User } from '../../users/contracts';

@Schema({ timestamps: true })
@ObjectType()
export class Group {
  @Prop()
  @Field()
  _id: string;

  @Prop()
  @Field()
  name: string;

  @Field(() => [User], { description: 'List of users participating in this group.' })
  participants?: string[] | User[];

  @Field(() => [Post], { description: 'The list of posts on this group.' })
  posts?: string[] | Post[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
