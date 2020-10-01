import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AddCommentInput {
  @Field({ description: 'The id of the post the comment is being made.' })
  post: string;
  @Field()
  body: string;
  @Field({ description: 'The user who made the comment' })
  user: string;
}
