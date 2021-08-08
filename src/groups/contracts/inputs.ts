import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddGroupPostInput {
  @Field({ nullable: true })
  title?: string;

  @Field()
  description: string;

  @Field(() => [String], {
    description: "An array of images id's, get from the UploadPostImage mutation",
    defaultValue: [],
  })
  imagesIds: string[];
}
