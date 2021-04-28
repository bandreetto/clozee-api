import { Field, InputType } from '@nestjs/graphql';
import { FeedTagsInput } from 'src/users/contracts/inputs';

@InputType()
export class SignUpInput {
  @Field({ nullable: true, description: 'The id of the pre-signed user.' })
  _id?: string;
  @Field()
  username: string;
  @Field()
  password: string;
  @Field({
    nullable: true,
    description:
      'The id of the image to use as avatar. Got from the mutation uploadAvatarUrl.',
  })
  avatarId: string;
  @Field(() => FeedTagsInput, {
    nullable: true,
    description: "Tags used to customize user's feed",
  })
  feedTags: FeedTagsInput;
}
