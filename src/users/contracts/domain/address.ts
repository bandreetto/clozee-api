import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';

@Schema({ _id: false })
@ObjectType()
export class Address {
  @Prop({ required: true })
  @Field()
  street: string;

  @Prop({ required: true })
  @Field()
  number: number;

  @Prop()
  @Field({ nullable: true })
  district?: string;

  @Prop()
  @Field({ nullable: true })
  zipCode?: string;

  @Prop({ required: true })
  @Field()
  city: string;

  @Prop({ required: true })
  @Field()
  country: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
