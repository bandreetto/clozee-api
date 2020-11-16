export * from './sales';

import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { Address, AddressSchema, User } from 'src/users/contracts';

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
  address: Address;

  @Field(() => [Post], { description: 'The posts of this order.' })
  posts?: Post[];

  @Field({ description: 'The total price of this order in cents.' })
  total?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
