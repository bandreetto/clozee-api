export * from './comment-tag-notification';
export * from './sale-notification';
export * from './post-comment-notification';
export * from './group-post-notification';
export * from './group-invite-notification';

import { Field, InterfaceType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentTagNotification } from './comment-tag-notification';
import { GroupInviteNotification } from './group-invite-notification';
import { GroupPostNotification } from './group-post-notification';
import { PostCommentNotification } from './post-comment-notification';
import { SaleNotification } from './sale-notification';

@Schema({ discriminatorKey: 'kind', timestamps: true })
@InterfaceType({
  resolveType(notification: Notification) {
    switch (notification.kind) {
      case CommentTagNotification.name:
        return CommentTagNotification;
      case SaleNotification.name:
        return SaleNotification;
      case PostCommentNotification.name:
        return PostCommentNotification;
      case GroupPostNotification.name:
        return GroupPostNotification;
      case GroupInviteNotification.name:
        return GroupInviteNotification;
      default:
        throw new Error('Unidentified Notification kind.');
    }
  },
})
export class Notification {
  @Prop()
  @Field()
  _id: string;

  @Prop({
    type: String,
    required: true,
    enum: [
      CommentTagNotification.name,
      SaleNotification.name,
      PostCommentNotification.name,
      GroupInviteNotification.name,
      GroupPostNotification.name,
    ],
  })
  @Field()
  kind: string;

  @Prop()
  @Field({
    description: 'Flag indicating if this notification is new and/or unseen.',
  })
  unseen: boolean;

  @Prop()
  user: string;

  @Field({ description: 'The moment this notification was sent.' })
  createdAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
