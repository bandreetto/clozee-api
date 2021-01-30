import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeliveryInfo {
  @Field(() => Int, { description: 'The delivery fare in cents.' })
  price: number;

  @Field(() => Int, {
    description: 'The expected delivery time in business days.',
  })
  deliveryTime: number;
}
