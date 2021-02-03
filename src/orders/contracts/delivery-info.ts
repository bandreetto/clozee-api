import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
@ObjectType()
export class DeliveryInfo {
  @Prop({ required: true })
  @Field(() => Int, { description: 'The delivery fare in cents.' })
  price: number;

  @Prop({ required: true })
  @Field(() => Int, {
    description: 'The expected delivery time in business days.',
  })
  deliveryTime: number;
}

export const DeliveryInfoSchema = SchemaFactory.createForClass(DeliveryInfo);