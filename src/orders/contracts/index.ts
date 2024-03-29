export * from './sale';
export * from './delivery-info';
export * from './pagarme-info';

import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from '../../posts/contracts';
import { Address, AddressSchema, User } from '../../users/contracts';
import { DeliveryInfo, DeliveryInfoSchema } from './delivery-info';
import { PagarmeInfo, PagarmeInfoSchema } from './pagarme-info';

@Schema({ timestamps: true })
@ObjectType()
export class Order {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true, unique: true })
  @Field(() => Int)
  number: number;

  @Prop({ type: String, required: true, index: true })
  @Field(() => User)
  buyer: string | User;

  @Prop()
  @Field()
  paymentMethod?: string;

  @Prop({ type: AddressSchema, required: true })
  @Field(() => Address)
  buyersAddress: Address;

  @Prop({ type: AddressSchema, required: true })
  @Field(() => Address)
  sellersAddress: Address;

  @Prop({ type: DeliveryInfoSchema })
  @Field(() => DeliveryInfo)
  deliveryInfo: DeliveryInfo;

  @Prop({ required: true })
  @Field({ description: 'The amount charged from the seller.' })
  clozeeTax: number;

  @Field({ description: 'The final amount that the seller will receive.' })
  sellerAmount?: number;

  @Field(() => [Post], { description: 'The posts of this order.' })
  posts?: Post[];

  @Field({ description: 'The total price of this order in cents.' })
  total?: number;

  @Field({ description: "The sum of the post's prices for this order." })
  itemsPrice?: number;

  @Field({ description: 'The amount of this order that was donated.' })
  donationAmount?: number;

  @Field()
  createdAt?: Date;

  @Prop({ type: PagarmeInfoSchema })
  pagarme?: PagarmeInfo;

  @Prop()
  deleted?: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
