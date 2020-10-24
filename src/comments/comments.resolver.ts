import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { v4 } from 'uuid';
import { CommentsService } from './comments.service';
import { AddCommentInput } from './contracts/dto/inputs';
import { Comment } from './contracts/domain';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts/domain';
import { getTaggedUsersFromComment } from './logic';
import { HttpException, HttpStatus } from '@nestjs/common';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Mutation(() => Comment)
  async addComment(@Args('input') input: AddCommentInput): Promise<Comment> {
    const [post, commentingUser] = await Promise.all([
      this.postsService.findById(input.post),
      this.usersService.findById(input.user),
    ]);

    if (!post)
      throw new HttpException(
        `Could not find a post with the id ${input.post}`,
        HttpStatus.NOT_FOUND,
      );
    if (!commentingUser)
      throw new HttpException(
        `Could not find a user with the id ${input.user}`,
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
      user: input.user,
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
