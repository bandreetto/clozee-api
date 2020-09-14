import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { User } from './contracts/domain';
import { UsersService } from './users.service';
import { AddPostInput } from './contracts/dto/inputs';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Mutation(() => User)
  addPost(@Args('addPostInput') input: AddPostInput) {
    return this.usersService.addPost(input.userId, input.postUrl);
  }
}
