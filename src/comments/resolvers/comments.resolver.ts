import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { v4 } from 'uuid';
import { CommentsService } from '../comments.service';
import { AddCommentInput } from '../contracts/dto/inputs';
import { Comment } from '../contracts/domain';
import { PostsService } from 'src/posts/posts.service';
import { Post } from 'src/posts/contracts/domain';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/contracts/domain';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Mutation(() => Comment)
  addComment(@Args('input') input: AddCommentInput): Promise<Comment> {
    return this.commentsService.create({
      _id: v4(),
      body: input.body,
      tags: input.tags,
      post: input.post,
      user: input.user,
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
}
