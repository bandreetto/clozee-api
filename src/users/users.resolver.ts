import { Resolver, Args, Query, ResolveField, Root } from '@nestjs/graphql';
import { User } from './contracts/domain';
import { UsersService } from './users.service';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { descend, sort } from 'ramda';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
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
