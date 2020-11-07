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
import { Post } from 'src/posts/contracts';
import { descend, sort } from 'ramda';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { S3Client } from 'src/common/s3';
import configuration from 'src/config/configuration';
import { v4 } from 'uuid';
import { AddressInput } from './contracts/dto/inputs';

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
  async savePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: true,
    });
    return this.usersService.findById(user._id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async unsavePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: false,
    });
    return this.usersService.findById(user._id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  updateAddress(
    @Args('address') newAddress: AddressInput,
    @CurrentUser() user: TokenUser,
  ) {
    return this.usersService.updateAddress(user._id, newAddress);
  }

  @Mutation(() => String, {
    description: 'Returns a pre-signed S3 URL that allows the avatar upload.',
  })
  uploadAvatarUrl(@CurrentUser() user: TokenUser): string {
    return S3Client.getSignedUrl('putObject', {
      Bucket: configuration.images.bucket(),
      Key: `avatars/${user?._id || ''}_${v4()}.jpg`,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => String, {
    description: 'Returns the user with the updated avatar url.',
  })
  async updateUserAvatar(
    @Args('newAvatarUrl') newAvatarUrl: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    const updatedUser = await this.usersService.updateAvatar(
      user._id,
      newAvatarUrl,
    );
    return updatedUser;
  }

  @ResolveField(() => [Post])
  async posts(@Root() user: User): Promise<Post[]> {
    const posts = await this.postsService.findManyByUser(user._id);
    return sort(
      descend(post => post.createdAt),
      posts,
    );
  }

  @ResolveField(() => [Post])
  async savedPosts(@Root() user: User): Promise<Post[]> {
    const savedPosts = await this.usersService.getUserSavedPosts(user._id);
    const postsIds = savedPosts.map(s => s.post);
    return this.postsService.findManyByIds(postsIds);
  }
}
