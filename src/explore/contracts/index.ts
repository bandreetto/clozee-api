import { Field, ObjectType } from '@nestjs/graphql';
import { SearchCategory } from '../../cms/contracts';
import { ClozeeEvent } from '../../clozee-events/contracts';
import { SearchUser } from './search-user';

@ObjectType()
export class Explore {
  @Field(() => [SearchUser])
  users: SearchUser[];
  @Field(() => [SearchCategory])
  categories: SearchCategory[];
  @Field(() => [ClozeeEvent], { description: 'A list of upcoming events.' })
  events: ClozeeEvent[];
}
