import {
  Resolver,
  Args,
  Mutation,
  ResolveField,
  Root,
  Query,
} from '@nestjs/graphql';
import { PostsService } from 'src/posts/posts.service';
import { v4 } from 'uuid';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { Comment } from 'src/comments/contracts';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { S3Client } from 'src/common/s3';
import configuration from 'src/config/configuration';
import { Post } from './contracts';
import { AddPostInput } from './contracts/inputs';
import { CategoriesService } from 'src/categories/categories.service';
import { Category } from 'src/categories/contracts';
import { SalesService } from 'src/orders/sales.service';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
    private readonly categoriesService: CategoriesService,
    private readonly salesService: SalesService,
  ) {}

  @Query(() => Post)
  post(@Args('postId') postId: string): Promise<Post> {
    return this.postsService.findById(postId);
  }

  @Query(() => [Post])
  posts(
    @Args('user', { description: 'Filter posts by user id' }) userId: string,
  ) {
    return this.postsService.findManyByUser(userId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => String, {
    description: 'Returns a pre-signed S3 URL that allows the avatar upload.',
  })
  uploadPostImage(@CurrentUser() user: TokenUser): string {
    return S3Client.getSignedUrl('putObject', {
      Bucket: configuration.images.bucket(),
      Key: `posts/${user._id}_${v4()}.jpg`,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async addPost(
    @Args('addPostInput') input: AddPostInput,
    @CurrentUser() user: TokenUser,
  ) {
    return this.postsService.create({
      ...input,
      _id: v4(),
      user: user._id,
    });
  }

  @ResolveField()
  async user(@Root() post: Post): Promise<User> {
    if (typeof post.user !== 'string') return post.user;
    return this.usersService.findById(post.user);
  }

  @ResolveField()
  async comments(@Root() post: Post): Promise<Comment[]> {
    return this.commentsService.findByPost(post._id);
  }

  @ResolveField()
  async category(@Root() post: Post): Promise<Category> {
    if (typeof post.category !== 'string') return post.category;
    return this.categoriesService.findById(post.category);
  }

  @ResolveField()
  async sold(@Root() post: Post): Promise<boolean> {
    return !!(await this.salesService.findByPost(post._id));
  }
}
