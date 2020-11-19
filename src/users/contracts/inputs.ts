import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CoordinatesInput {
  @Field(() => Float)
  latitude: number;
  @Field(() => Float)
  longitude: number;
}

@InputType()
export class AddressInput {
  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  number?: number;

  @Field({ nullable: true })
  district?: string;

  @Field({ nullable: true })
  zipCode?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field(() => CoordinatesInput, { nullable: true })
  coordinates: CoordinatesInput;
}

@InputType()
export class AddCreditCardInput {
  @Field({ description: 'Card id provided by the payment gateway.' })
  cardId: string;

  @Field({ description: 'Last 4 digits of the credit card.' })
  lastDigits: string;

  @Field({ description: "The card's flag." })
  flag: string;
}