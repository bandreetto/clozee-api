export * from './address';
export * from './saved-post';
export * from './payment-method';
export * from './bank';

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { Address, AddressSchema } from './address';
import { Post } from 'src/posts/contracts';
import { PaymentMethod } from './payment-method';

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

  @Field(() => [PaymentMethod], {
    description: 'The ids of users credit cards',
  })
  paymentMethods?: PaymentMethod[];

  @Field()
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
