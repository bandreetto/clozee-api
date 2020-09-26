import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from 'src/posts/contracts/domain';

@Schema()
@ObjectType()
export class User {
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  name: string;

  @Field(() => [Post])
  posts: Post[];
}

export const UserSchema = SchemaFactory.createForClass(User);
