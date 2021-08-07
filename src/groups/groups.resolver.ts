import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { TokenUser } from '../common/types';
import { PostsService } from '../posts/posts.service';
import { UsersService } from '../users/users.service';
import { v4 } from 'uuid';
import { Group } from './contracts';
import { AddGroupPostInput } from './contracts/inputs';
import { GroupsService } from './groups.service';
import { UsersLoader } from 'src/users/users.dataloaders';
import { User } from 'src/users/contracts';
import { Post } from 'src/posts/contracts';

@Resolver(Group)
export class GroupsResolver {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly usersLoader: UsersLoader,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => Group, { description: 'Returns a group by id. Only return groups that the user is part of.' })
  async group(@Args('id') groupId: string, @CurrentUser() tokenUser: TokenUser): Promise<Group> {
    const group = await this.groupsService.findById(groupId);
    if (!group) throw new NotFoundException(`Could not find group with the id ${groupId}`);
    const groupParticipants = await this.groupsService.findParticipantsByGroupId(groupId);
    if (!groupParticipants.find(gp => gp.user === tokenUser._id))
      throw new NotFoundException(`Could not find group with the id ${groupId}`);
    return { ...group, participants: groupParticipants.map(gp => gp.user) };
  }

  @UseGuards(AuthGuard)
  @Query(() => [Group], { description: 'Return the groups that this user is participating in.' })
  async groups(@CurrentUser() tokenUser: TokenUser): Promise<Group[]> {
    const participating = await this.groupsService.findParticipantsByUser(tokenUser._id);
    const groups = await this.groupsService.findManyByIds(participating.map(participant => participant.group));
    const allParticipants = await this.groupsService.findParticipantsByManyGroupIds(groups.map(group => group._id));
    return groups.map(group => {
      const participants = allParticipants.filter(participant => participant.group === group._id);

      return {
        ...group,
        participants,
      };
    });
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Group, { description: 'Create a new group for this user and the provided participants.' })
  async createGroup(
    @Args('name', { description: 'The name of the group.' }) name: string,
    @Args('participants', { type: () => [String], description: 'The user ids of the participants of this group.' })
    participantsUserIds: string[],
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    const group = await this.groupsService.createGroup({
      _id: v4(),
      name,
    });
    const participants = [tokenUser._id, ...participantsUserIds];
    const groupParticipants = participants.map(participantUserId => ({
      _id: v4(),
      user: participantUserId,
      group: group._id,
    }));
    await this.groupsService.createGroupParticipants(groupParticipants);
    return {
      ...group,
      participants: participants,
    };
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Group, { description: 'Adds a post to the group.' })
  async addPostToGroup(
    @Args('groupId') groupId: string,
    @Args('post') post: AddGroupPostInput,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    if (groupId === '404') {
      throw new NotFoundException('Could not find group to add post');
    }
    const posts = await this.postsService.findLastDistinctUsersPosts(6);
    const participants = await this.usersService.findManyByIds([
      ...(posts.map(p => p.user) as string[]),
      tokenUser._id,
    ]);

    return {
      _id: groupId,
      name: 'Grupo com mais 1 post',
      posts: posts,
      participants,
    };
  }

  @ResolveField()
  participants(@Root() group: Group): Promise<User[]> {
    const users = group.participants.map((participant: string | User) => {
      if (typeof participant !== 'string') return participant;
      return this.usersLoader.load(participant);
    });
    return Promise.all(users);
  }

  @ResolveField()
  posts(@Root() group: Group): Promise<Post[]> {
    return Promise.all([]);
  }
}
