import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/contracts';

@ObjectType()
export class AuthResponse {
  @Field({ description: "The token's owner user." })
  me: User;
  @Field({
    description:
      'A short lived access token, used to authenticate and grant access to the subject.',
  })
  token: string;
  @Field({ description: 'A long lived token, used to get a new access token.' })
  refreshToken: string;
}
