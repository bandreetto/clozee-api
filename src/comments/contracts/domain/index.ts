import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts/domain';

@Schema({ timestamps: true })
@ObjectType()
export class Comment {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  body: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [User], {
    defaultValue: [],
    description: 'The users tagged on this comment',
  })
  tags: string[] | User[];

  @Prop({ type: String, required: true })
  @Field(() => Post, { description: 'The post that the comment belongs to' })
  post: string | Post;

  @Prop({ type: String, required: true })
  @Field(() => User, { description: 'The user who made the comment' })
  user: string | User;

  @Field()
  createdAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
