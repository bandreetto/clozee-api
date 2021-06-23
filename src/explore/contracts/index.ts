import { Field, ObjectType } from '@nestjs/graphql';
import { SearchCategory } from 'src/cms/contracts';
import { SearchUser } from './search-user';

@ObjectType()
export class Explore {
  @Field(() => [SearchUser])
  users: SearchUser[];
  @Field(() => [SearchCategory])
  categories: SearchCategory[];
}
