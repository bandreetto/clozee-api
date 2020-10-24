import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { escapeRegex } from 'src/common/regex';
import { Address, User } from './contracts/domain';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User & Document>,
  ) {}

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).lean();
  }

  async findManyById(ids: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: ids } }).lean();
  }

  async findManyByUsernames(usernames: string[]): Promise<User[]> {
    return this.userModel.find({ username: { $in: usernames } }).lean();
  }

  async addPost(id: string, postUrl: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(
        { _id: id },
        { $push: { sellingProducts: postUrl } },
        { new: true },
      )
      .lean<User>();
  }

  async updateAddress(
    userId: string,
    newAddress: Partial<Address>,
  ): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { address: newAddress as Address } },
        { new: true },
      )
      .lean<User>();

    return updatedUser as User;
  }

  async filter(
    filters: { username?: string; name?: string },
    limit: number,
  ): Promise<User[]> {
    const filtersArray = [];
    if (filters.username)
      filtersArray.push({
        username: new RegExp(`^${escapeRegex(filters.username)}`, 'i'),
      });
    if (filters.name)
      filtersArray.push({
        name: new RegExp(`^${escapeRegex(filters.name)}`, 'i'),
      });
    return this.userModel
      .find({
        $or: filtersArray,
      })
      .limit(limit)
      .lean<User>();
  }
}
