import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Order } from 'src/orders/contracts';
import { Notification } from '.';

@Schema()
@ObjectType({
  implements: () => [Notification],
})
export class SaleNotification implements Notification {
  _id: string;
  kind: string;
  user: string;
  unseen: boolean;
  createdAt?: Date;

  @Prop({ type: String, required: true })
  @Field(() => Order, {
    description: 'The order of the sales.',
  })
  order: string | Order;
}

export const SaleNotificationSchema = SchemaFactory.createForClass(
  SaleNotification,
);
