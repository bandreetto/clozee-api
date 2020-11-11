import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { escapeRegex } from 'src/common/regex';
import { Address, SavedPost, User } from './contracts';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User & Document>,
    @InjectModel(SavedPost.name)
    private readonly savedPostModel: Model<SavedPost & Document>,
  ) {}

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).lean();
  }

  async findManyById(ids: string[]): Promise<User[]> {
    return this.userModel.find({ _id: { $in: ids } }).lean();
  }

  async findByUsername(username: string): Promise<User> {
    return this.userModel.findOne({ username }).lean();
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
    const fieldsToUpdate = Object.entries(newAddress)
      .filter(([_key, value]) => value)
      .reduce(
        (acc, [key, value]) => ({ ...acc, [`address.${key}`]: value }),
        {},
      );
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: fieldsToUpdate }, { new: true })
      .lean<User>();

    return updatedUser as User;
  }

  async updateAvatar(userId: string, newAvatarUrl: string) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { avatar: newAvatarUrl } },
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

  async create(newUser: User): Promise<User> {
    const user = await this.userModel.create(newUser);
    return user.toObject();
  }

  async getUserSavedPosts(userId: string): Promise<SavedPost[]> {
    return this.savedPostModel
      .find({
        saved: true,
        user: userId,
      })
      .lean();
  }

  async upsertSavedPost(newSavedPost: SavedPost): Promise<SavedPost> {
    const savedPost = await this.savedPostModel
      .updateOne(
        {
          user: newSavedPost.user,
          post: newSavedPost.post,
        },
        {
          ...newSavedPost,
        },
        { upsert: true, new: true },
      )
      .lean();
    return savedPost as SavedPost;
  }
}
