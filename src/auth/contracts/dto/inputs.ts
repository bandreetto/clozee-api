import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SignUpInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field({ nullable: true })
  avatartUrl: string;
}
