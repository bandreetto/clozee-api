export * from './sale';
export * from './delivery-info';

import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { Address, AddressSchema, User } from 'src/users/contracts';
import { DeliveryInfo, DeliveryInfoSchema } from './delivery-info';

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

  @Prop({ required: true })
  @Field()
  paymentMethod: string;

  @Prop({ type: AddressSchema, required: true })
  @Field(() => Address)
  buyersAddress: Address;

  @Prop({ type: AddressSchema, required: true })
  @Field(() => Address)
  sellersAddress: Address;

  @Prop({ type: DeliveryInfoSchema })
  @Field(() => DeliveryInfo)
  deliveryInfo: DeliveryInfo;

  @Field(() => [Post], { description: 'The posts of this order.' })
  posts?: Post[];

  @Field({ description: 'The total price of this order in cents.' })
  total?: number;

  @Field({ description: "The sum of the post's prices for this order." })
  itemsPrice?: number;

  @Field()
  createdAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
