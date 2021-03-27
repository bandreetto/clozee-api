import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { Comment } from 'src/comments/contracts';
import { Notification } from '.';

@Schema()
@ObjectType({
  implements: () => [Notification],
})
export class PostCommentNotification implements Notification {
  _id: string;
  kind: string;
  unseen: boolean;
  user: string;
  createdAt?: Date;

  @Prop({ type: String, required: true })
  @Field(() => Comment, {
    description: 'The comment created on the post',
  })
  comment: string | Comment;

  @Prop({ type: String, required: true })
  @Field(() => Post, {
    description: 'The post that the comment was commented on.',
  })
  post: string | Post;
}

export const PostComentNotificationSchema = SchemaFactory.createForClass(
  PostCommentNotification,
);
