import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class AddPostInput {
  @Field()
  userId: string;

  @Field()
  postUrl: string;
}
