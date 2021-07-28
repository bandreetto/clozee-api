import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { PostsService } from 'src/posts/posts.service';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { Group } from './contracts';

@Resolver(Group)
export class GroupsResolver {
  constructor(private readonly postsService: PostsService, private readonly usersSerivce: UsersService) {}

  @UseGuards(AuthGuard)
  @Query(() => Group, { description: 'Returns a group by id. Only return groups that the user is part of.' })
  async group(@Args('id') groupId: string): Promise<Group> {
    if (groupId === '404') throw new NotFoundException(`Could not find group with the id ${groupId}`);

    const posts = await this.postsService.findLastDistinctUsersPosts(6);
    return {
      _id: groupId,
      name: 'Nome do Grupo',
      posts: posts,
      participants: await this.usersSerivce.findManyByIds(posts.map(p => p.user) as string[]),
    };
  }

  @UseGuards(AuthGuard)
  @Mutation()
  async createGroup(
    @Args('name', { description: 'The name of the group.' }) name: string,
    @Args('participants', { description: 'The user ids of the participants of this group.' }) participants: string[],
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    return {
      _id: v4(),
      name: name,
      posts: [],
      participants: await this.usersSerivce.findManyByIds([...participants, tokenUser._id]),
    };
  }
}
