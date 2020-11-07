import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { v4 } from 'uuid';
import { CommentsService } from './comments.service';
import { AddCommentInput } from './contracts/dto/inputs';
import { Comment } from './contracts/domain';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts/domain';
import { getTaggedUsersFromComment } from './logic';
import { HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
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
    return this.commentsService.create({
      _id: v4(),
      body: input.body,
      post: input.post,
      user: user._id,
      tags,
    });
  }

  @ResolveField()
  async post(@Root() comment: Comment): Promise<Post> {
    if (typeof comment.post !== 'string') return comment.post;
    return this.postsService.findById(comment.post);
  }

  @ResolveField()
  async user(@Root() comment: Comment): Promise<User> {
    if (typeof comment.user !== 'string') return comment.user;
    return this.usersService.findById(comment.user);
  }

  @ResolveField()
  async tags(@Root() comment: Comment): Promise<User[]> {
    return this.usersService.findManyById(comment.tags as string[]);
  }
}
