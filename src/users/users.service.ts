import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { startsWith } from 'ramda';
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
    filters: {
      username?: string;
      name?: string;
      startsWith?: boolean;
    },
    limit: number,
    exclude: string[] = [],
  ): Promise<User[]> {
    const filtersArray = [];
    if (filters.username) {
      const usernameRegex = new RegExp(
        `${filters.startsWith ? '^' : ''}${escapeRegex(filters.username)}`,
        'i',
      );
      filtersArray.push({
        username: usernameRegex,
      });
    }

    if (filters.name) {
      const nameRegex = new RegExp(
        `${filters.startsWith ? '^' : ''}${escapeRegex(filters.name)}`,
        'i',
      );
      filtersArray.push({
        name: nameRegex,
      });
    }
    return this.userModel
      .find({
        ...(exclude.length > 0 ? { _id: { $nin: exclude } } : null),
        ...(filtersArray.length > 0 ? { $or: filtersArray } : null),
      })
      .limit(limit)
      .lean<User>();
  }

  existsWithUsername(username: string): Promise<boolean> {
    return this.userModel.exists({ username });
  }

  create(newUser: User): Promise<User> {
    return this.userModel.create(newUser);
  }
}
