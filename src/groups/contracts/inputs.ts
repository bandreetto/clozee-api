import { InputType } from '@nestjs/graphql';
import { AddPostInput } from 'src/posts/contracts/inputs';

@InputType()
export class AddGroupPostInput extends AddPostInput {}
