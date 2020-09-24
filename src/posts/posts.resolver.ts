import {
  Resolver,
  Args,
  Mutation,
  ResolveField,
  Root,
  Query,
} from '@nestjs/graphql';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { AddPostInput } from './contracts/dto/inputs';
import { v4 } from 'uuid';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts/domain';
import { HttpException, HttpStatus } from '@nestjs/common';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => Post)
  post(@Args('postId') postId: string): Promise<Post> {
    return this.postsService.findById(postId);
  }

  @Mutation(() => Post)
  async addPost(@Args('addPostInput') input: AddPostInput) {
    const user = await this.usersService.findById(input.user);
    if (!user) {
      throw new HttpException(
        'You must provide an existing user',
        HttpStatus.BAD_REQUEST,
      );
    }
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
