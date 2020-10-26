import { Field, InputType } from '@nestjs/graphql';

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
}

@InputType()
export class UpdateAddressInput {
  @Field()
  userId: string;

  @Field(() => AddressInput)
  newAddress: AddressInput;
}
