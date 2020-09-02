import { getModelForClass, prop } from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field((type) => ID)
  id: string;

  @Field()
  @prop({ required: true })
  name: string;

  @Field((type) => [String])
  @prop({ default: [] })
  sellingProducts?: string[];
}

export const UserModel = getModelForClass(User);
