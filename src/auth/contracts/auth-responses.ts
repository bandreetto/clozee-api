import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/contracts';

@ObjectType()
export class AuthResponse {
  @Field({ description: "The token's owner user." })
  me: User;
  @Field({
    description: 'A short lived access token, used to authenticate and grant access to the subject.',
  })
  token: string;
  @Field({ description: 'A long lived token, used to get a new access token.' })
  refreshToken: string;
}

@ObjectType()
export class PreSignResponse {
  @Field({ description: 'The pre-signed user token.' })
  preSignToken: string;
  @Field({
    description: 'The pre-signed user id. Use it to create the user later.',
  })
  userId: string;
}
