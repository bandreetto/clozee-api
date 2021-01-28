import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeliveryInfo {
  @Field(() => Float, { description: 'The delivery fare in Reais.' })
  price: number;

  @Field(() => Int, {
    description: 'The expected delivery time in business days.',
  })
  deliveryTime: number;
}
