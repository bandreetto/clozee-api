import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Bank } from './bank';
import { ACCOUNT_TYPES } from './enum';

@Schema({ _id: false })
@ObjectType()
export class BankInfo {
  @Prop({ type: String, required: true })
  @Field(() => Bank, { description: 'The user banking institution.' })
  bank: string | Bank;

  @Prop({ required: true, maxlength: 5 })
  @Field({ description: "User's bank agency." })
  agency: string;

  @Prop({ maxlength: 1 })
  @Field({ nullable: true, description: 'The agency verifying digit.' })
  agencyDv?: string;

  @Prop({ required: true, maxlength: 13 })
  @Field({ description: "User's bank account number." })
  account: string;

  @Prop({ maxlength: 2 })
  @Field({ nullable: true, description: 'The bank account verifying digit.' })
  accountDv?: string;

  @Prop({ required: true, default: ACCOUNT_TYPES.CURRENT })
  @Field(() => ACCOUNT_TYPES, { description: "The user's bank account type." })
  accountType: ACCOUNT_TYPES;

  @Prop({ required: true })
  @Field({ description: 'The name of the account holder.' })
  holderName: string;

  @Prop({ required: true })
  @Field({ description: 'The document number of the account holder.' })
  holderDocument: string;
}

export const BankInfoSchema = SchemaFactory.createForClass(BankInfo);
