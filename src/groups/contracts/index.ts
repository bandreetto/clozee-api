import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from '../../posts/contracts';
import { User } from '../../users/contracts';

@ObjectType()
export class Group {
  @Field()
  _id: string;

  @Field()
  name: string;

  @Field(() => [User], { description: 'List of users participating in this group.' })
  participants: User[];

  @Field(() => [Post], { description: 'The list of posts on this group.' })
  posts: Post[];
}
