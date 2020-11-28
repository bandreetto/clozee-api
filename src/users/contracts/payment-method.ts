import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class PaymentMethod {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field({ description: 'Card id provided by the payment gateway.' })
  cardId: string;

  @Prop({ required: true })
  @Field({ description: 'Last 4 digits of the credit card.' })
  lastDigits: string;

  @Prop({ required: true })
  @Field({ description: "The card's flag." })
  flag: string;

  @Prop({ required: true, index: true })
  user: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
