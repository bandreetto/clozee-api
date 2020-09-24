import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class AddPostInput {
  @Field({ description: "The id of the post's user" })
  user: string;

  @Field()
  title: string;

  @Field()
  size: string;

  @Field()
  description: string;

  @Field(() => [String], { description: 'An array of urls for post images' })
  images: string[];

  @Field(() => [String], {
    description: 'An array of strings representing the post categories',
    defaultValue: [],
  })
  categories: string[];
}
