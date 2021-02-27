import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { AuthGuard } from '../common/guards/auth.guard';
import { LikesService } from './likes.service';
import { PostsService } from '../posts/posts.service';
import { Like } from './contracts';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LikePayload } from './contracts/payloads';

@Resolver(() => Like)
export class LikesResolver {
  constructor(
    private readonly likesService: LikesService,
    private readonly postsService: PostsService,
    private readonly eventEmitter: EventEmitter2,
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

    this.eventEmitter.emit('post.liked', { post: postId } as LikePayload);
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

    this.eventEmitter.emit('post.unliked', { post: postId } as LikePayload);
    return this.postsService.findById(postId);
  }
}
