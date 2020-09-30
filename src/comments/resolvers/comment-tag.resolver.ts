import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { User } from 'src/users/contracts/domain';
import { UsersService } from 'src/users/users.service';
import { CommentTag } from '../contracts/domain/comment-tag';

@Resolver(() => CommentTag)
export class CommentTagResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveField()
  async user(@Root() tag: CommentTag): Promise<User> {
    if (typeof tag.user !== 'string') return tag.user;
    return this.usersService.findById(tag.user);
  }
}
