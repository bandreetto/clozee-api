import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { v4 } from 'uuid';
import { CommentsService } from './comments.service';
import { Comment } from './contracts';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/contracts';
import { UsersService } from '../users/users.service';
import { User } from '../users/contracts';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { TokenUser } from '../common/types';
import { AddCommentInput } from './contracts/inputs';
import { PostsLoader } from '../posts/posts.dataloader';
import { getTaggedUsersFromComment } from './comments.logic';
import { UsersLoader } from '../users/users.dataloaders';
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
  async addComment(@Args('input') input: AddCommentInput, @CurrentUser() user: TokenUser): Promise<Comment> {
    const post = await this.postsService.findById(input.post);

    if (!post) throw new NotFoundException(`Could not find a post with the id ${input.post}`);

    const usernames = getTaggedUsersFromComment(input.body);
    const users = await this.usersService.findManyByUsernames(usernames);
    const tags = users.filter(user => usernames.some(username => user.username === username)).map(user => user._id);
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
      commentOwner: user,
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
    return this.usersLoader.loadMany(comment.tags as string[]) as Promise<User[]>;
  }
}
