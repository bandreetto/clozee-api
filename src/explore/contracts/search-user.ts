import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SearchUser {
  @Field()
  userId: string;
  @Field()
  username: string;
  @Field()
  avatarUrl: string;
}
