import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { v4 } from 'uuid';
import { CommentsService } from './comments.service';
import { Comment } from './contracts';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { AddCommentInput } from './contracts/inputs';
import { PostsLoader } from 'src/posts/posts.dataloader';
import { getTaggedUsersFromComment } from './comments.logic';
import { UsersLoader } from 'src/users/users.dataloaders';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    private readonly postsLoader: PostsLoader,
    private readonly usersService: UsersService,
    private readonly usersLoader: UsersLoader,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Comment)
  async addComment(
    @Args('input') input: AddCommentInput,
    @CurrentUser() user: TokenUser,
  ): Promise<Comment> {
    const post = await this.postsService.findById(input.post);

    if (!post)
      throw new HttpException(
        `Could not find a post with the id ${input.post}`,
        HttpStatus.NOT_FOUND,
      );

    const usernames = getTaggedUsersFromComment(input.body);
    const users = await this.usersService.findManyByUsernames(usernames);
    const tags = users
      .filter(user => usernames.some(username => user.username === username))
      .map(user => user._id);
    const createdComment = await this.commentsService.create({
      _id: v4(),
      body: input.body,
      post: input.post,
      user: user._id,
      tags,
    });
    this.eventEmitter.emit('comment.created', {
      comment: createdComment,
      post,
      user,
    });
    return createdComment;
  }

  @ResolveField()
  async post(@Root() comment: Comment): Promise<Post> {
    if (typeof comment.post !== 'string') return comment.post;
    return this.postsLoader.load(comment.post);
  }

  @ResolveField()
  async user(@Root() comment: Comment): Promise<User> {
    if (typeof comment.user !== 'string') return comment.user;
    return this.usersLoader.load(comment.user);
  }

  @ResolveField()
  async tags(@Root() comment: Comment): Promise<User[]> {
    return this.usersLoader.loadMany(comment.tags as string[]) as Promise<
      User[]
    >;
  }
}
