import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CheckoutInput {
  @Field(() => [String], { description: 'The array of posts being bought.' })
  posts: string[];

  @Field({
    description: "The id of the user's payment method to use on the checkout.",
  })
  paymentMethodId: string;

  @Field({ description: 'The id of the delivery info for this checkout.' })
  deliveryInfoId: string;
}
