import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
@ObjectType()
export class Bank {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  name: string;
}

export const BankSchema = SchemaFactory.createForClass(Bank);
