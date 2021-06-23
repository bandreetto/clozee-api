import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchCategory {
  @Field()
  id: number;
  @Field({ description: 'The title of the category to be displayed to the user.' })
  title: string;
  @Field({ description: 'The search term to be used.' })
  searchTerm: string;
  @Field({ description: 'Url to the search category image.' })
  imageUrl: string;
}
