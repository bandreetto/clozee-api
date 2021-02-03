import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class Delivery {
  @Prop()
  _id: string;

  @Prop({ required: true })
  @Field()
  buyersZipCode: string;

  @Prop({ required: true })
  @Field()
  sellersZipCode: string;

  @Prop({ required: true })
  @Field(() => Int, { description: 'The delivery fare in cents.' })
  price: number;

  @Prop({ required: true })
  @Field(() => Int, {
    description: 'The expected delivery time in business days.',
  })
  deliveryTime: number;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
