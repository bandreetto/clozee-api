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
  country?: string;

  @Field(() => CoordinatesInput, { nullable: true })
  coordinates: CoordinatesInput;
}
