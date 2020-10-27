export * from './address';

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from 'src/posts/contracts/domain';
import { Address, AddressSchema } from './address';

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Prop()
  @Field()
  _id: string;

  @Prop()
  @Field({ nullable: true })
  name?: string;

  @Field(() => [Post])
  posts?: Post[];

  @Prop({ required: true, index: true, unique: true })
  @Field()
  username: string;

  @Prop()
  @Field({ nullable: true })
  avatar?: string;

  @Prop({ type: AddressSchema })
  @Field(() => Address, { nullable: true })
  address?: Address;

  @Field()
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
