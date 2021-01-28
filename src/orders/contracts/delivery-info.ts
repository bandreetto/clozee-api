import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DeliveryInfo {
  @Field({ description: 'The delivery fare in Reais.' })
  price: string;

  @Field(() => Int, {
    description: 'The expected delivery time in business days.',
  })
  deliveryTime: number;
}
