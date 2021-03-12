import { Field, Float, InputType, ArgsType } from '@nestjs/graphql';
import { SIZES } from 'src/posts/contracts/enums';
import { ACCOUNT_TYPES, GENDER_TAGS } from './enum';

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
  complement?: string;

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

@ArgsType()
export class AddCreditCardInput {
  @Field({ description: "The credit card's number" })
  number: string;
  @Field()
  holderName: string;
  @Field({
    description:
      "The month and year of the card's expiration date, following the fomat MMYY",
  })
  expirationDate: string;
  @Field()
  cvv: string;
}

@InputType()
export class BankInfoInput {
  @Field({ description: 'The bank number.' })
  bank: string;

  @Field({ description: "User's bank agency." })
  agency: string;

  @Field({ nullable: true, description: 'The agency verifying digit.' })
  agencyDv: string;

  @Field({ description: "User's bank account number." })
  account: string;

  @Field({
    description: 'The bank account verifying digit.',
  })
  accountDv: string;

  @Field(() => ACCOUNT_TYPES, {
    description: "The user's bank account type",
  })
  accountType: ACCOUNT_TYPES;

  @Field({ description: 'The name of the account holder.' })
  holderName: string;

  @Field({ description: 'The document number of the account holder.' })
  holderDocument: string;
}

@InputType()
export class UpdateUserInfoInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  cpf?: string;

  @Field({ nullable: true })
  phoneNumber?: string;
}

@InputType()
export class FeedTagsInput {
  @Field(() => [SIZES], { description: "User's preferred sizes." })
  sizes: SIZES[];

  @Field(() => [GENDER_TAGS], {
    description: 'Users prefered clothing models.',
  })
  genders: GENDER_TAGS[];
}
