import { UseGuards } from '@nestjs/common';
import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { AuthGuard } from '../common/guards/auth.guard';
import { LikesService } from './likes.service';
import { PostsService } from '../posts/posts.service';
import { Like } from './contracts/index';
import { PostsLoader } from '../posts/posts.dataloader';
import { User } from 'src/users/contracts';
import { UsersLoader } from '../users/users.dataloaders';

@Resolver(() => Like)
export class LikesResolver {
  constructor(
    private readonly likesService: LikesService,
    private readonly postsService: PostsService,
    private readonly postsLoader: PostsLoader,
    private readonly usersLoader: UsersLoader,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async likePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    await this.likesService.upsertLike({
      _id: `${postId}:${user._id}`,
      post: postId,
      user: user._id,
      deleted: false,
    });

    return this.postsService.findById(postId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Post)
  async unlikePost(
    @Args('postId') postId: string,
    @CurrentUser() user: TokenUser,
  ): Promise<Post> {
    await this.likesService.upsertLike({
      _id: `${postId}:${user._id}`,
      post: postId,
      user: user._id,
      deleted: true,
    });

    return this.postsService.findById(postId);
  }

  // @ResolveField()
  // async post(@Root() like: Like): Promise<Post> {
  //   if (typeof like.post !== 'string') return like.post;
  //   return this.postsLoader.load(like.post);
  // }

  // @ResolveField()
  // async user(@Root() like: Like): Promise<User> {
  //   if (typeof like.user !== 'string') return like.user;
  //   return this.usersLoader.load(like.user);
  // }
}
