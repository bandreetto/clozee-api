import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class AddPostInput {
  @Field()
  title: string;

  @Field()
  size: string;

  @Field()
  description: string;

  @Field(() => [String], { description: 'An array of urls for post images' })
  images: string[];

  @Field(() => String, {
    description: 'The id of the post category.',
  })
  category: string;

  @Field({ description: 'Price of the item being announced in cents' })
  price: number;
}
