import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';

@Schema()
@ObjectType()
export class User {
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  name: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [String])
  sellingProducts: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
