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
import { UseGuards } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { Comment } from 'src/comments/contracts/domain';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { S3Client } from 'src/common/s3';
import configuration from 'src/config/configuration';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
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
}
