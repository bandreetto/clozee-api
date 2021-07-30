export * from './address';
export * from './bank';
export * from './bank-info';
export * from './feed-tags';
export * from './payment-method';
export * from './saved-post';

import { Field, Int, ObjectType, Float } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from '../../posts/contracts';
import { Address, AddressSchema } from './address';
import { BankInfo, BankInfoSchema } from './bank-info';
import { FeedTags, FeedTagsSchema } from './feed-tags';
import { PaymentMethod } from './payment-method';
import { sentitiveData } from '../user.field-middlewares';
import { Group } from '../../groups/contracts';

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Prop()
  @Field()
  _id: string;

  @Prop()
  @Field({ nullable: true, middleware: [sentitiveData] })
  pagarmeRecipientId?: string;

  @Prop()
  @Field({ nullable: true })
  name?: string;

  @Prop()
  @Field({ nullable: true, middleware: [sentitiveData] })
  email?: string;

  @Prop()
  @Field({ nullable: true, middleware: [sentitiveData] })
  cpf?: string;

  @Prop()
  @Field({ nullable: true, middleware: [sentitiveData] })
  phoneNumber?: string;

  @Prop({ type: BankInfoSchema })
  @Field(() => BankInfo, { nullable: true, middleware: [sentitiveData] })
  bankInfo?: BankInfo;

  @Field(() => [Post])
  posts?: Post[];

  @Field(() => [Post], { defaultValue: [], middleware: [sentitiveData] })
  savedPosts?: Post[];

  @Prop({ index: true })
  @Field({ nullable: true })
  username?: string;

  @Prop()
  @Field({ nullable: true })
  avatar?: string;

  @Prop({ type: AddressSchema })
  @Field(() => Address, { nullable: true, middleware: [sentitiveData] })
  address?: Address;

  @Prop({ type: FeedTagsSchema, default: {} })
  @Field(() => FeedTags, {
    description: "Tags used to customize user's feed.",
    middleware: [sentitiveData],
  })
  feedTags?: FeedTags;

  @Field({
    description: 'The device token used for push notifications.',
    middleware: [sentitiveData],
  })
  @Prop()
  deviceToken?: string;

  @Field(() => [User], {
    description: 'The list of users blocked by this user.',
  })
  @Prop({ default: [], middleware: [sentitiveData] })
  blockedUsers?: string[] | User[];

  @Field(() => Int, {
    description: 'The user specific fixed tax in cents. Overrides clozee default fixed tax.',
    nullable: true,
  })
  @Prop()
  fixedTaxOverride?: number;

  @Field(() => Float, {
    description:
      'A number in the range [0,1] representing the user specific percentage tax. Overrides clozee default percentage tax.',
    nullable: true,
  })
  @Prop()
  variableTaxOverride?: number;

  @Field(() => [PaymentMethod], {
    description: 'The ids of users credit cards',
    middleware: [sentitiveData],
  })
  paymentMethods?: PaymentMethod[];

  @Field(() => [User])
  followers?: User[];

  @Field(() => [User], {
    description: 'The list of users following this user.',
  })
  following?: User[];

  @Field({
    description: 'A boolean indicating weather the current user is following this user.',
  })
  isFollowing?: boolean;

  @Field()
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
