import { BadRequestException, UseGuards, NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { EventEmitter2 } from 'eventemitter2';
import { descend, sort, uniq } from 'ramda';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { S3Client } from '../common/s3';
import { TokenUser, UploadImageResponse } from '../common/types';
import configuration from '../config/configuration';
import { PagarmeService } from '../payments/pagarme.service';
import { Post } from '../posts/contracts';
import { PostsLoader } from '../posts/posts.dataloader';
import { PostsService } from '../posts/posts.service';
import { v4 } from 'uuid';
import { FeedTags, PaymentMethod, User } from './contracts';
import {
  AddCreditCardInput,
  AddressInput,
  BankInfoInput,
  FeedTagsInput,
  UpdateUserInfoInput,
} from './contracts/inputs';
import { BlockUserPayload } from './contracts/payloads';
import { UsersLoader } from './users.dataloaders';
import { UsersService } from './users.service';
import { FollowsLoader } from '../follows/follows.dataloader';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersLoader: UsersLoader,
    private readonly postsLoader: PostsLoader,
    private readonly postsService: PostsService,
    private readonly pagarmeService: PagarmeService,
    private readonly followsLoader: FollowsLoader,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Queries

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
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<User[]> {
    let blacklistedUsers: string[] = [];
    if (tokenUser) {
      const user = await this.usersService.findById(tokenUser._id);
      blacklistedUsers = user.blockedUsers as string[];
    }

    const usersResult = await this.usersService.filter(
      {
        startsWith: true,
        name: searchTerm,
        username: searchTerm,
      },
      60,
      blacklistedUsers,
    );
    if (usersResult.length < 60) {
      const expandedSearch = await this.usersService.filter(
        {
          name: searchTerm,
          username: searchTerm,
        },
        60 - usersResult.length,
        [...usersResult.map(user => user._id), ...blacklistedUsers],
      );

      return [...usersResult, ...expandedSearch];
    }
    return usersResult;
  }

  // Mutations

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  updateUserFeedTags(@Args('tags') tagsInput: FeedTagsInput, @CurrentUser() { _id }: TokenUser): Promise<User> {
    const feedTags: FeedTags = {
      sizes: uniq(tagsInput.sizes),
      genders: uniq(tagsInput.genders),
    };

    return this.usersService.updateUser(_id, {
      feedTags,
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async savePost(@Args('postId') postId: string, @CurrentUser() user: TokenUser): Promise<Post> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: true,
    });
    return this.postsService.findById(postId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async unsavePost(@Args('postId') postId: string, @CurrentUser() user: TokenUser): Promise<Post> {
    await this.usersService.upsertSavedPost({
      user: user._id,
      post: postId,
      saved: false,
    });
    return this.postsService.findById(postId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async updateUserInfo(@Args('input') input: UpdateUserInfoInput, @CurrentUser() user: TokenUser): Promise<User> {
    return this.usersService.updateUser(user._id, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async updateBankInfo(@Args('bankInfo') input: BankInfoInput, @CurrentUser() user: TokenUser): Promise<User> {
    const userData = await this.usersService.findById(user._id);
    const userAlreadyHasBankInfo = !!userData.bankInfo;
    const isChangingHolderDocument =
      userAlreadyHasBankInfo && userData.bankInfo.holderDocument !== input.holderDocument;

    if (isChangingHolderDocument) {
      throw new BadRequestException('Cannot update the account holder document');
    }

    const userRecipientId = userData.pagarmeRecipientId;

    const recipientId = userRecipientId
      ? await this.pagarmeService.updateRecipient(input, userRecipientId)
      : await this.pagarmeService.createRecipient({
          ...userData,
          bankInfo: input,
        });

    return this.usersService.updateUser(user._id, {
      pagarmeRecipientId: recipientId,
      bankInfo: input,
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  updateAddress(@Args('address') newAddress: AddressInput, @CurrentUser() user: TokenUser) {
    return this.usersService.updateAddress(user._id, newAddress);
  }

  @Mutation(() => String, {
    description: 'Returns a pre-signed S3 URL that allows the avatar upload.',
    deprecationReason: 'Replaced by createUserAvatar. Use it intead.',
  })
  uploadAvatarUrl(@CurrentUser() user: TokenUser): string {
    return S3Client.getSignedUrl('putObject', {
      Bucket: configuration.images.bucket(),
      Key: `avatars/${user?._id || ''}_${v4()}.jpg`,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
  }

  @Mutation(() => UploadImageResponse, {
    description: 'Returns the avatar image Id and a pre-signed S3 URL that allows the avatar image upload.',
  })
  createUserAvatar(@CurrentUser() user: TokenUser): UploadImageResponse {
    const avatarId = `${user?._id || ''}_${v4()}`;
    return {
      imageId: avatarId,
      signedUrl: S3Client.getSignedUrl('putObject', {
        Bucket: configuration.images.bucket(),
        Key: `avatars/${avatarId}.jpg`,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      }),
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User, {
    description: 'Returns the user with the updated avatar url.',
  })
  async updateUserAvatar(
    @Args('newAvatarUrl', {
      nullable: true,
      description: 'DEPRECATED. Use newAvatarId parameter.',
    })
    newAvatarUrl: string,
    @Args('newAvatarId', { nullable: true }) newAvatarId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<User> {
    const avatarUrl = newAvatarId ? `https://${configuration.images.cdn()}/avatars/${newAvatarId}.jpg` : newAvatarUrl;
    const updatedUser = await this.usersService.updateUser(user._id, {
      avatar: avatarUrl,
    });
    return updatedUser;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async addCreditCard(@Args() input: AddCreditCardInput, @CurrentUser() user: TokenUser): Promise<User> {
    const card = await this.pagarmeService.createCard(input.number, input.holderName, input.expirationDate, input.cvv);
    await this.usersService.addPaymentMethod(user._id, {
      flag: card.brand,
      cardId: card.id,
      lastDigits: card.last_digits,
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
  addDeviceToken(@Args('deviceToken') deviceToken: string, @CurrentUser() user: TokenUser): Promise<User> {
    return this.usersService.updateUser(user._id, { deviceToken });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  removeDeviceToken(@CurrentUser() user: TokenUser): Promise<User> {
    return this.usersService.updateUser(user._id, { deviceToken: null });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async blockUser(@Args('userId') blockedUserId: string, @CurrentUser() user: User): Promise<User> {
    const userBlocked = await this.usersService.findById(blockedUserId);
    if (!userBlocked) throw new NotFoundException('Could not find the user to block.');
    const updatedUser = await this.usersService.addToBlockedUsers(user._id, blockedUserId);
    this.eventEmitter.emit('user.blocked', {
      blockingUser: updatedUser,
      blockedUserId: blockedUserId,
    } as BlockUserPayload);
    return updatedUser;
  }

  // Field Resolvers

  @ResolveField()
  async posts(@Root() user: User): Promise<Post[]> {
    const posts = await this.postsLoader.byUser.load(user._id);
    const notDeletedPosts = posts.filter(post => !post.deleted);
    const feedPosts = notDeletedPosts.filter(post => post.type === 'FeedPost');
    return sort(
      descend(post => post.createdAt),
      feedPosts,
    );
  }

  @ResolveField()
  async savedPosts(@Root() user: User): Promise<Post[]> {
    const savedPosts = await this.usersLoader.savedPosts.load(user._id);
    const postsIds = savedPosts.sort(descend(post => post.updatedAt)).map(s => s.post);
    const posts = await Promise.all(postsIds.map(post => this.postsLoader.load(post)));
    return posts.filter(post => !post.deleted);
  }

  @ResolveField()
  async paymentMethods(@Root() user: User): Promise<PaymentMethod[]> {
    return this.usersLoader.paymentMethods.load(user._id);
  }

  @ResolveField()
  async blockedUsers(@Root() user: User): Promise<User[]> {
    return Promise.all(
      user.blockedUsers.map((blockedUser: string | User) => {
        if (typeof blockedUser !== 'string') return blockedUser;
        return this.usersLoader.load(blockedUser);
      }),
    );
  }

  @ResolveField()
  async followers(@Root() user: User): Promise<User[]> {
    const follows = await this.followsLoader.byFollowee.load(user._id);
    return Promise.all(follows.map(follow => this.usersLoader.load(follow.follower)));
  }

  @ResolveField()
  async following(@Root() user: User): Promise<User[]> {
    const follows = await this.followsLoader.byFollower.load(user._id);
    return Promise.all(follows.map(follow => this.usersLoader.load(follow.followee)));
  }

  @ResolveField()
  async isFollowing(@Root() user: User, @CurrentUser() currentUser: TokenUser): Promise<boolean> {
    const follows = await this.followsLoader.byFollowee.load(user._id);
    return !!follows.find(follow => follow.follower === currentUser?._id);
  }
}
