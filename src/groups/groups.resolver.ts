import { BadRequestException, NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { TokenUser } from '../common/types';
import { PostsService } from '../posts/posts.service';
import { v4 } from 'uuid';
import { Group } from './contracts';
import { AddGroupPostInput } from './contracts/inputs';
import { GroupsService } from './groups.service';
import { UsersLoader } from 'src/users/users.dataloaders';
import { User } from 'src/users/contracts';
import { Post } from 'src/posts/contracts';
import configuration from 'src/config/configuration';
import { PostsLoader } from 'src/posts/posts.dataloader';
import { EventEmitter2 } from 'eventemitter2';

@Resolver(Group)
export class GroupsResolver {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly postsService: PostsService,
    private readonly postsLoader: PostsLoader,
    private readonly usersLoader: UsersLoader,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => Group, { description: 'Returns a group by id. Only return groups that the user is part of.' })
  async group(@Args('id') groupId: string, @CurrentUser() tokenUser: TokenUser): Promise<Group> {
    const group = await this.groupsService.findById(groupId);
    if (!group) throw new NotFoundException(`Could not find group with the id ${groupId}`);
    const groupParticipants = await this.groupsService.findParticipantsByGroupId(groupId);
    if (!groupParticipants.find(participant => participant.user === tokenUser._id))
      throw new NotFoundException(`Could not find group with the id ${groupId}`);
    return group;
  }

  @UseGuards(AuthGuard)
  @Query(() => [Group], { description: 'Return the groups that this user is participating in.' })
  async groups(@CurrentUser() tokenUser: TokenUser): Promise<Group[]> {
    const participating = await this.groupsService.findParticipantsByUser(tokenUser._id);
    const groups = await this.groupsService.findManyByIds(participating.map(participant => participant.group));
    return groups;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Group, { description: 'Create a new group for this user and the provided participants.' })
  async createGroup(
    @Args('name', { description: 'The name of the group.' }) name: string,
    @Args('participants', { type: () => [String], description: 'The user ids of the participants of this group.' })
    participantsUserIds: string[],
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    const participants = await Promise.all(
      participantsUserIds.map(particpantUserId => this.usersLoader.load(particpantUserId)),
    );
    if (participants.some(participant => !participant)) {
      throw new BadRequestException('Participants must be an array of valid user ids.');
    }
    const group = await this.groupsService.createGroup({
      _id: v4(),
      name,
    });
    const participantsIds = [tokenUser._id, ...participantsUserIds];
    const groupParticipants = participantsIds.map(participantUserId => ({
      _id: v4(),
      user: participantUserId,
      group: group._id,
    }));
    await this.groupsService.createGroupParticipants(groupParticipants);
    this.eventEmitter.emit('group.created', { group, participants, groupCreator: tokenUser });
    return group;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Group, { description: 'Adds a post to the group.' })
  async addPostToGroup(
    @Args('groupId') groupId: string,
    @Args('post') post: AddGroupPostInput,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Group> {
    const group = await this.groupsService.findById(groupId);
    if (!group) {
      throw new NotFoundException('Could not find the group to add post.');
    }
    const participants = await this.groupsService.findParticipantsByGroupId(groupId);
    if (!participants.find(participant => participant.user === tokenUser._id)) {
      throw new NotFoundException('Could not find the group to add post.');
    }
    const createdPost = await this.postsService.create({
      _id: v4(),
      ...post,
      images: post.imagesIds.map(imageId => `https://${configuration.images.cdn()}/posts/${imageId}.jpg`),
      user: tokenUser._id,
      type: 'GroupPost',
    });
    await this.groupsService.createGroupPost({
      _id: v4(),
      post: createdPost._id,
      group: group._id,
    });
    this.eventEmitter.emit('group-post.created', { group, post: createdPost, postOwner: tokenUser });
    return group;
  }

  @ResolveField()
  async participants(@Root() group: Group): Promise<User[]> {
    const participants = await this.groupsService.findParticipantsByGroupId(group._id);
    const users = participants.map(participant => {
      return this.usersLoader.load(participant.user);
    });
    return Promise.all(users);
  }

  @ResolveField()
  async posts(@Root() group: Group): Promise<Post[]> {
    const groupPosts = await this.groupsService.findGroupPostsByGroupId(group._id);
    return Promise.all(groupPosts.map(groupPost => this.postsLoader.load(groupPost.post)));
  }
}
