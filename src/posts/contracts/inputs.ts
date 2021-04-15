import { InputType, Field, Int } from '@nestjs/graphql';
import { POST_CONDITIONS, SIZES } from './enums';

@InputType()
export class AddPostInput {
  @Field()
  title: string;

  @Field(() => SIZES)
  size: SIZES;

  @Field()
  description: string;

  @Field(() => [String], { description: 'An array of urls for post images.' })
  images: string[];

  @Field(() => String, {
    description: 'The id of the post category.',
  })
  category: string;

  @Field(() => POST_CONDITIONS, {
    description: "The condition of this post's product.",
  })
  condition: POST_CONDITIONS;

  @Field(() => Int, {
    description: 'Price of the item being announced in cents.',
  })
  price: number;

  @Field({
    defaultValue: 0,
    description:
      "The percentage of the seller's profit being destined to donation.",
  })
  donationPercentage: number;
}

@InputType()
export class UpdatePostFields {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'The new price of the item in cents.',
  })
  price?: number;

  @Field({ nullable: true })
  size?: SIZES;

  @Field(() => [String], {
    nullable: true,
    description: 'An array of urls for the new post images.',
  })
  images?: string[];

  @Field({
    nullable: true,
    description: 'The new category id of this post.',
  })
  category?: string;

  @Field(() => POST_CONDITIONS, {
    nullable: true,
    description: "The new condition of the post's product",
  })
  condition?: POST_CONDITIONS;
}
