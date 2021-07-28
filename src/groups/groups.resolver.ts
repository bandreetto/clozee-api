import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { TokenUser } from '../common/types';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import { v4 } from 'uuid';
import { Group } from './contracts';

@Resolver(Group)
export class GroupsResolver {
  constructor(private readonly postsService: PostsService, private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Query(() => Group, { description: 'Returns a group by id. Only return groups that the user is part of.' })
  async group(@Args('id') groupId: string): Promise<Group> {
    if (groupId === '404') throw new NotFoundException(`Could not find group with the id ${groupId}`);

    const posts = await this.postsService.findLastDistinctUsersPosts(6);
    return {
      _id: groupId,
      name: 'Nome do Grupo',
      posts: posts,
      participants: await this.usersService.findManyByIds(posts.map(p => p.user) as string[]),
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Group, { description: 'Create a new group for this user and the provided participants.' })
  async createGroup(
    @Args('name', { description: 'The name of the group.' }) name: string,
    @Args('participants', { type: () => [String], description: 'The user ids of the participants of this group.' })
    participants: string[],
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    return {
      _id: v4(),
      name: name,
      posts: [],
      participants: await this.usersService.findManyByIds([...participants, tokenUser._id]),
    };
  }
}
