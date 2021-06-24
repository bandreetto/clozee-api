import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Post } from './contracts';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<Post & Document>) {}

  async create(post: Omit<Post, 'comments'>): Promise<Post> {
    const newPost = await this.postModel.create({
      ...post,
      comments: [],
    });
    return newPost.toObject();
  }

  async findAllNotDeleted(): Promise<Post[]> {
    return this.postModel.find({ deleted: { $ne: true } }).lean();
  }

  async findManyByUser(userId: string): Promise<Post[]> {
    return this.postModel.find({ user: userId }).lean();
  }

  async findManyByUsers(userIds: string[]): Promise<Post[]> {
    return this.postModel.find({ user: { $in: userIds } }).lean();
  }

  async findById(postId: string): Promise<Post> {
    return this.postModel.findOne({ _id: postId }).lean();
  }

  async findManyByIds(postsIds: string[]): Promise<Post[]> {
    return this.postModel.find({ _id: { $in: postsIds } }).lean();
  }

  async findLastDistinctUsersPosts(count: number): Promise<Post[]> {
    const userPosts = await this.postModel.aggregate<{ _id: [string]; lastPost: Post }>([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          lastPost: { $first: '$$ROOT' },
        },
      },
      { $sort: { 'lastPost.createdAt': -1 } },
      { $limit: count },
    ]);

    return userPosts.map(up => up.lastPost);
  }

  async countAfter(query: { createdAt?: Date; includeDeleted?: boolean }): Promise<number> {
    return this.postModel.countDocuments({
      ...(query.createdAt ? { createdAt: { $lt: query.createdAt } } : null),
      deleted: query.includeDeleted || false,
    });
  }

  async updateOne(postId: string, fieldsToUpdate: Partial<Post>): Promise<Post> {
    return this.postModel
      .findByIdAndUpdate(
        postId,
        {
          $set: fieldsToUpdate,
        },
        { new: true },
      )
      .lean();
  }
}
