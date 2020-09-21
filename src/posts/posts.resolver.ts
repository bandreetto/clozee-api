import { Resolver, Args, Mutation, ResolveField, Root } from '@nestjs/graphql';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { AddPostInput } from './contracts/dto/inputs';
import { v4 } from 'uuid';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts/domain';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Mutation(() => Post)
  addPost(@Args('addPostInput') input: AddPostInput) {
    return this.postsService.create({
      ...input,
      _id: v4(),
    });
  }

  @ResolveField()
  async user(@Root() post: Post): Promise<User> {
    if (typeof post.user !== 'string') return post.user;
    return this.usersService.findById(post.user);
  }
}
