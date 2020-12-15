export * from './comment-tag-notification';
export * from './sale-notification';

import { Field, InterfaceType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentTagNotification } from './comment-tag-notification';
import { SaleNotification } from './sale-notification';

@Schema({ discriminatorKey: 'kind', timestamps: true })
@InterfaceType({
  resolveType(notification: Notification) {
    switch (notification.kind) {
      case CommentTagNotification.name:
        return CommentTagNotification;
      case SaleNotification.name:
        return SaleNotification;
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
    enum: [CommentTagNotification.name],
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
