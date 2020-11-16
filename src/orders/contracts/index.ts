export * from './sales';

import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
