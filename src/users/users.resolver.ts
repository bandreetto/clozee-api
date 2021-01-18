import { BadRequestException, UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Root,
} from '@nestjs/graphql';
import { descend, sort } from 'ramda';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { S3Client } from 'src/common/s3';
import { TokenUser } from 'src/common/types';
import configuration from 'src/config/configuration';
import { Post } from 'src/posts/contracts';
import { PostsLoader } from 'src/posts/posts.dataloader';
import { v4 } from 'uuid';
import { PaymentMethod, User } from './contracts';
import {
  AddCreditCardInput,
  AddressInput,
  UpdateUserInfoInput,
} from './contracts/inputs';
import { UsersLoader } from './users.dataloaders';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersLoader: UsersLoader,
    private readonly postsLoader: PostsLoader,
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
  @Mutation(() => Post)
  async savePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: true,
    });
    return this.postsLoader.load(postId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async unsavePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: false,
    });
    return this.postsLoader.load(postId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  updateUserInfo(
    @Args('input') input: UpdateUserInfoInput,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    return this.usersService.updateUser(user._id, input);
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
  @Mutation(() => User, {
    description: 'Returns the user with the updated avatar url.',
  })
  async updateUserAvatar(
    @Args('newAvatarUrl') newAvatarUrl: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    const updatedUser = await this.usersService.updateUser(user._id, {
      avatar: newAvatarUrl,
    });
    return updatedUser;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async addCreditCard(
    @Args('input') input: AddCreditCardInput,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    if (input.lastDigits.length !== 4)
      throw new BadRequestException('Last digits must be a string of length 4');
    await this.usersService.addPaymentMethod(user._id, {
      ...input,
      _id: v4(),
    });
    return this.usersService.findById(user._id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async deletePaymentMethod(
    @Args('paymentMethodId') paymentMethodId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    await this.usersService.deletePaymentMethod(user._id, paymentMethodId);
    return this.usersService.findById(user._id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  addDeviceToken(
    @Args('deviceToken') deviceToken: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    return this.usersService.updateUser(user._id, { deviceToken });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  removeDeviceToken(@CurrentUser() user: TokenUser): Promise<User> {
    return this.usersService.updateUser(user._id, { deviceToken: null });
  }

  @ResolveField()
  async posts(@Root() user: User): Promise<Post[]> {
    const posts = await this.postsLoader.byUser.load(user._id);
    const notDeletedPosts = posts.filter(post => !post.deleted);
    return sort(
      descend(post => post.createdAt),
      notDeletedPosts,
    );
  }

  @ResolveField()
  async savedPosts(@Root() user: User): Promise<Post[]> {
    const savedPosts = await this.usersLoader.savedPosts.load(user._id);
    const postsIds = savedPosts
      .sort(descend(post => post.updatedAt))
      .map(s => s.post);
    const posts = await Promise.all(
      postsIds.map(post => this.postsLoader.load(post)),
    );
    return posts.filter(post => !post.deleted);
  }

  @ResolveField()
  async paymentMethods(@Root() user: User): Promise<PaymentMethod[]> {
    return this.usersLoader.paymentMethods.load(user._id);
  }
}
