import { Field, ObjectType } from '@nestjs/graphql';
import { User } from 'src/users/contracts/domain';

@ObjectType()
export class LogInResponse {
  @Field({
    description:
      'A short lived access token, used to authenticate and grant access to the subject.',
  })
  token: string;
  @Field({ description: 'A long lived token, used to get a new access token.' })
  refreshToken: string;
}

@ObjectType()
export class SignUpResponse extends LogInResponse {
  @Field({ description: 'The created user.' })
  user: User;
}
