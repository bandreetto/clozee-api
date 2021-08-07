import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddGroupPostInput {
  @Field()
  _id: string;

  @Field()
  title?: string;

  @Field()
  description: string;

  @Field(() => [String], {
    description: "An array of images id's, get from the UploadPostImage mutation",
    defaultValue: [],
  })
  imagesIds: string[];
}
