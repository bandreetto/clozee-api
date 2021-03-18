export * from './address';
export * from './bank';
export * from './bank-info';
export * from './feed-tags';
export * from './payment-method';
export * from './saved-post';

import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { Address, AddressSchema } from './address';
import { BankInfo, BankInfoSchema } from './bank-info';
import { FeedTags, FeedTagsSchema } from './feed-tags';
import { PaymentMethod } from './payment-method';

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Prop()
  @Field()
  _id: string;

  @Prop()
  @Field({ nullable: true })
  pagarmeRecipientId?: string;

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

  @Prop({ index: true })
  @Field({ nullable: true })
  username?: string;

  @Prop()
  @Field({ nullable: true })
  avatar?: string;

  @Prop({ type: AddressSchema })
  @Field(() => Address, { nullable: true })
  address?: Address;

  @Prop({ type: FeedTagsSchema, default: {} })
  @Field(() => FeedTags, { description: "Tags used to customize user's feed." })
  feedTags?: FeedTags;

  @Field()
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
