import { Field, Float, InputType } from '@nestjs/graphql';
import { ACCOUNT_TYPES } from './enum';

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
    nullable: true,
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

  @Field({ nullable: true, description: "The user's banking info." })
  bankInfo?: BankInfoInput;
}
