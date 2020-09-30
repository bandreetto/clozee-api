import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts/domain';
import { User } from 'src/users/contracts/domain';
import { CommentTag, CommentTagSchema } from './comment-tag';

@Schema()
@ObjectType()
export class Comment {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  body: string;

  @Prop({ type: [CommentTagSchema], default: [] })
  @Field(() => [CommentTag], { defaultValue: [] })
  tags: CommentTag[];

  @Prop({ type: String, required: true })
  @Field(() => Post, { description: 'The post that the comment belongs to' })
  post: string | Post;

  @Prop({ type: String, required: true })
  @Field(() => User, { description: 'The user who made the comment' })
  user: string | User;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
