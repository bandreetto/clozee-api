export * from './address';
export * from './saved-post';
export * from './payment-method';
export * from './bank';
export * from './bank-info';

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { Address, AddressSchema } from './address';
import { Post } from 'src/posts/contracts';
import { PaymentMethod } from './payment-method';
import { BankInfo, BankInfoSchema } from './bank-info';

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Prop()
  @Field()
  _id: string;

  @Prop()
  @Field({ nullable: true })
  name?: string;

  @Prop()
  @Field({ nullable: true })
  email?: string;

  @Prop()
  @Field({ nullable: true })
  cpf?: string;

  @Prop()
  @Field({ nullable: true })
  phoneNumber?: string;

  @Prop({ type: BankInfoSchema })
  @Field(() => BankInfo, { nullable: true })
  bankInfo?: BankInfo;

  @Field(() => [Post])
  posts?: Post[];

  @Field(() => [Post])
  savedPosts?: Post[];

  @Prop({ required: true, index: true, unique: true })
  @Field()
  username: string;

  @Prop()
  @Field({ nullable: true })
  avatar?: string;

  @Prop({ type: AddressSchema })
  @Field(() => Address, { nullable: true })
  address?: Address;

  @Prop()
  deviceToken?: string;

  @Field(() => [PaymentMethod], {
    description: 'The ids of users credit cards',
  })
  paymentMethods?: PaymentMethod[];

  @Field()
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
