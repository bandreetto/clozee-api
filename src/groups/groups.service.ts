import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Group, GroupParticipant, GroupPost } from './contracts';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group & Document>,
    @InjectModel(GroupParticipant.name) private readonly groupParticipantModel: Model<GroupParticipant & Document>,
    @InjectModel(GroupPost.name) private readonly groupPostModel: Model<GroupPost & Document>,
  ) {}

  async findById(groupId: string): Promise<Group> {
    return this.groupModel.findById({ _id: groupId }).lean();
  }

  async findManyByIds(groupIds: string[]): Promise<Group[]> {
    return this.groupModel
      .find({
        _id: { $in: groupIds },
      })
      .lean();
  }

  async findParticipantsByGroupId(groupId: string): Promise<GroupParticipant[]> {
    return this.groupParticipantModel
      .find({
        group: groupId,
      })
      .lean();
  }

  async findParticipantsByManyGroupIds(groupIds: string[]): Promise<GroupParticipant[]> {
    return this.groupParticipantModel
      .find({
        group: { $in: groupIds },
      })
      .lean();
  }

  async findParticipantsByUser(userId: string): Promise<GroupParticipant[]> {
    return this.groupParticipantModel
      .find({
        user: userId,
      })
      .lean();
  }

  async findGroupPostsByGroupId(groupId: string): Promise<GroupPost[]> {
    return this.groupPostModel
      .find({
        group: groupId,
      })
      .lean();
  }

  async createGroup(group: Group): Promise<Group> {
    const createdGroup = await this.groupModel.create(group);
    return createdGroup.toObject();
  }

  async createGroupParticipants(groupParticipants: GroupParticipant[]): Promise<GroupParticipant[]> {
    const createdParticipants = await this.groupParticipantModel.insertMany(groupParticipants);
    return createdParticipants.map(participant => participant.toObject());
  }

  async createGroupPost(groupPost: GroupPost): Promise<GroupPost> {
    const createdGroupPost = await this.groupPostModel.create(groupPost);
    return createdGroupPost.toObject();
  }
}
