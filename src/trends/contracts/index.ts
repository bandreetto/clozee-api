import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/contracts';

@ObjectType()
export class Trend {
  @Field()
  id: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => User, { description: 'User owner of this post.' })
  user: User | string;
}
