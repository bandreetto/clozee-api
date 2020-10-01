import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from './contracts/domain';

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

  async findManyByUsername(usernames: string[]): Promise<User[]> {
    return this.userModel.find({ username: { $in: usernames } }).lean();
  }

  async addPost(id: string, postUrl: string) {
    return this.userModel
      .findByIdAndUpdate(
        { _id: id },
        { $push: { sellingProducts: postUrl } },
        { new: true },
      )
      .lean<User>();
  }
}
