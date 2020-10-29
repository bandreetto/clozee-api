import {
  Resolver,
  Args,
  Query,
  ResolveField,
  Root,
  Mutation,
} from '@nestjs/graphql';
import { User } from './contracts/domain';
import { UsersService } from './users.service';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { descend, sort } from 'ramda';
import { AddressInput } from './contracts/dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => User)
  me(@CurrentUser() user: TokenUser) {
    return this.usersService.findById(user._id);
  }

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Query(() => [User], { description: 'A list of 60 users' })
  async users(
    @Args('searchTerm', { nullable: true })
    searchTerm: string,
  ): Promise<User[]> {
    const usersResult = await this.usersService.filter(
      {
        startsWith: true,
        name: searchTerm,
        username: searchTerm,
      },
      60,
    );
    if (usersResult.length < 60) {
      const expandedSearch = await this.usersService.filter(
        {
          name: searchTerm,
          username: searchTerm,
        },
        60 - usersResult.length,
        usersResult.map(user => user._id),
      );

      return [...usersResult, ...expandedSearch];
    }
    return usersResult;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  updateAddress(
    @Args('address') newAddress: AddressInput,
    @CurrentUser() user: TokenUser,
  ) {
    return this.usersService.updateAddress(user._id, newAddress);
  }

  @ResolveField(() => [Post])
  async posts(@Root() user: User): Promise<Post[]> {
    const posts = await this.postsService.findManyByUser(user._id);
    return sort(
      descend(post => post.createdAt),
      posts,
    );
  }
}
