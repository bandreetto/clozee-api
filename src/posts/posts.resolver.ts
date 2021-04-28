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
import { User } from 'src/users/contracts';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Comment } from 'src/comments/contracts';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser, TokenTypes } from 'src/common/decorators';
import { TokenUser, UploadImageResponse } from 'src/common/types';
import { S3Client } from 'src/common/s3';
import configuration from 'src/config/configuration';
import { Post } from './contracts';
import { AddPostInput, UpdatePostFields } from './contracts/inputs';
import { Category } from 'src/categories/contracts';
import { CommentsLoader } from 'src/comments/comments.dataloader';
import { UsersLoader } from 'src/users/users.dataloaders';
import { CategoriesLoader } from 'src/categories/categories.dataloader';
import { SalesLoader } from 'src/orders/sales.dataloader';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LikesLoader } from '../likes/likes.dataloader';
import { OrdersService } from 'src/orders/orders.service';
import { TOKEN_TYPES } from 'src/auth/contracts/enums';
import { getDonationAmount } from 'src/orders/orders.logic';

@Resolver(() => Post)
export class PostsResolver {
  logger = new Logger(PostsResolver.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly usersLoader: UsersLoader,
    private readonly commentsLoader: CommentsLoader,
    private readonly categoriesLoader: CategoriesLoader,
    private readonly ordersService: OrdersService,
    private readonly salesLoader: SalesLoader,
    private readonly likesLoader: LikesLoader,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Queries

  @Query(() => Post)
  async post(@Args('postId') postId: string): Promise<Post> {
    const post = await this.postsService.findById(postId);
    if (post.deleted) throw new GoneException('This post was deleted.');
    return post;
  }

  @Query(() => [Post])
  posts(
    @Args('user', { description: 'Filter posts by user id' }) userId: string,
  ) {
    return this.postsService
      .findManyByUser(userId)
      .then(posts => posts.filter(post => !post.deleted));
  }

  // Mutations

  @UseGuards(AuthGuard)
  @Mutation(() => UploadImageResponse, {
    description: 'Returns a pre-signed S3 URL that allows the avatar upload.',
  })
  uploadPostImage(@CurrentUser() user: TokenUser): UploadImageResponse {
    const imageId = `${user._id}_${v4()}`;
    return {
      imageId,
      signedUrl: S3Client.getSignedUrl('putObject', {
        Bucket: configuration.images.bucket(),
        Key: `posts/${imageId}.jpg`,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      }),
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async addPost(
    @Args('addPostInput') input: AddPostInput,
    @CurrentUser() user: TokenUser,
  ) {
    const createdPost = await this.postsService.create({
      ...input,
      _id: v4(),
      user: user._id,
    });

    this.eventEmitter.emit('post.created', createdPost);

    return createdPost;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async editPost(
    @Args('postId') postId: string,
    @Args('updateFields') updateFields: UpdatePostFields,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    const userPosts = await this.postsService.findManyByUser(user._id);
    if (!userPosts.find(userPost => userPost._id === postId))
      throw new ForbiddenException('You can only edit your posts.');
    return this.postsService.updateOne(postId, updateFields);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async deletePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    const userPosts = await this.postsService.findManyByUser(user._id);
    if (!userPosts.some(userPost => userPost._id === postId))
      throw new ForbiddenException('You can only delete your own posts.');

    const [postSale] = await this.ordersService.findSalesByPosts([postId]);
    if (postSale) throw new ConflictException('You cannot delete a sold post.');

    const deletedPost = await this.postsService.updateOne(postId, {
      deleted: true,
    });
    this.eventEmitter.emit('post.deleted', deletedPost);
    return deletedPost;
  }

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.ACCESS, TOKEN_TYPES.PRE_SIGN)
  @Mutation(() => Post)
  async reportPost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ) {
    const post = await this.postsService.findById(postId);
    this.logger.warn(`Post ${postId} reported by user ${user._id}!`);
    return this.postsService.updateOne(postId, {
      reportedBy: [...post.reportedBy, user._id],
    });
  }

  // Field Resolvers

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

  @ResolveField()
  async saved(
    @Root() post: Post,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<boolean> {
    if (!tokenUser) return false;

    const userSavedPosts = await this.usersLoader.savedPosts.load(
      tokenUser._id,
    );
    return userSavedPosts.some(savedPost => savedPost.post === post._id);
  }

  @ResolveField()
  async likes(@Root() post: Post): Promise<number> {
    return this.likesLoader.countByPost.load(post._id);
  }

  @ResolveField()
  async liked(
    @Root() post: Post,
    @CurrentUser() user: TokenUser,
  ): Promise<boolean> {
    if (!user) return false;
    return this.likesLoader.load(`${post._id}:${user._id}`).then(Boolean);
  }

  @ResolveField()
  async donationAmount(@Root() post: Post): Promise<number> {
    return getDonationAmount([post]);
  }
}
