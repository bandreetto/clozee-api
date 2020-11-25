import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Comment } from 'src/comments/contracts';
import { Post } from 'src/posts/contracts';
import { Notification } from '.';

@Schema()
@ObjectType({
  implements: () => [Notification],
})
export class CommentTagNotification implements Notification {
  _id: string;
  kind: string;
  user: string;
  createdAt?: Date;

  @Prop({ type: String, required: true })
  @Field(() => Comment, {
    description: 'The comment that the user was tagged on.',
  })
  comment: string | Comment;
}

export const CommentTagNotificationSchema = SchemaFactory.createForClass(
  CommentTagNotification,
);
