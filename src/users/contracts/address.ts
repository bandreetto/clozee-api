import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, Float } from '@nestjs/graphql';

@Schema({ _id: false })
@ObjectType()
export class Coordinates {
  @Prop({ required: true })
  @Field(() => Float)
  latitude: number;
  @Prop({ required: true })
  @Field(() => Float)
  longitude: number;
}

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
  complement?: string;

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
  state: string;

  @Prop()
  @Field(() => Coordinates, { nullable: true })
  coordinates: Coordinates;
}

export const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);
export const AddressSchema = SchemaFactory.createForClass(Address);
