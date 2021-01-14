import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts';

@Schema({ timestamps: true })
// @ObjectType()
export class Like {
  @Prop()
  _id: string;

  @Prop()
  deleted: boolean;

  @Prop({ type: String, required: true, index: true })
  // @Field(() => Post, { description: 'The post that the user has liked.' })
  post: string | Post;

  @Prop({ type: String, required: true })
  // @Field(() => User, { description: 'The user who liked.' })
  user: string | User;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
