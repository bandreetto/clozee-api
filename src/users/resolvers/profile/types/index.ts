import { arrayProp, getModelForClass, prop } from "@typegoose/typegoose";
import { ModelType } from "@typegoose/typegoose/lib/types";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field((type) => ID)
  id: string;

  @Field()
  @prop({ required: true })
  name: string;

  @Field((type) => [String])
  @arrayProp({ items: String, default: [] })
  sellingProducts?: string[];
}

export const UserModel: ModelType<User> = getModelForClass(User);
