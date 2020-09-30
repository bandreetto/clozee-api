import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CommentTagInput {
  @Field(() => Int, { description: 'The char index where the tag starts' })
  bodyIndex: number;
  @Field({ description: 'Id of the tagged user.' })
  user: string;
}

@InputType()
export class AddCommentInput {
  @Field({ description: 'The id of the post the comment is being made.' })
  post: string;
  @Field()
  body: string;
  @Field(() => [CommentTagInput], { defaultValue: [] })
  tags: CommentTagInput[];
  @Field({ description: 'The user who made the comment' })
  user: string;
}
