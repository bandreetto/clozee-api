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
import { Comment } from 'src/comments/contracts';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { S3Client } from 'src/common/s3';
import configuration from 'src/config/configuration';
import { Post } from './contracts';
import { AddPostInput } from './contracts/inputs';
import { Category } from 'src/categories/contracts';
import { CommentsLoader } from 'src/comments/comments.dataloader';
import { UsersLoader } from 'src/users/users.dataloaders';
import { CategoriesLoader } from 'src/categories/categories.dataloader';
import { SalesLoader } from 'src/orders/sales.dataloader';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersLoader: UsersLoader,
    private readonly commentsLoader: CommentsLoader,
    private readonly categoriesLoader: CategoriesLoader,
    private readonly salesLoader: SalesLoader,
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
    return this.usersLoader.load(post.user);
  }

  @ResolveField()
  async comments(@Root() post: Post): Promise<Comment[]> {
    return this.commentsLoader.byPost.load(post._id);
  }

  @ResolveField()
  async category(@Root() post: Post): Promise<Category> {
    if (typeof post.category !== 'string') return post.category;
    return this.categoriesLoader.load(post.category);
  }

  @ResolveField()
  async sold(@Root() post: Post): Promise<boolean> {
    return !!(await this.salesLoader.byPost.load(post._id));
  }
}
