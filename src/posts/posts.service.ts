import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Post } from './contracts';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post & Document>,
  ) {}

  async create(post: Omit<Post, 'comments'>): Promise<Post> {
    const newPost = await this.postModel.create({
      ...post,
      comments: [],
    });
    return newPost.toObject();
  }

  async findManyByUser(userId: string): Promise<Post[]> {
    return this.postModel.find({ user: userId }).lean();
  }

  async findManyByUsers(userIds: string[]): Promise<Post[]> {
    return this.postModel.find({ user: { $in: userIds } }).lean();
  }

  async findById(postId: string): Promise<Post> {
    return this.postModel.findById(postId).lean();
  }

  async findManyByIds(postsIds: string[]): Promise<Post[]> {
    return this.postModel.find({ _id: { $in: postsIds } }).lean();
  }

  async findSortedBy<TKey extends keyof Post>(
    amount: number,
    sortBy: TKey,
    after?: Post[TKey],
  ): Promise<Post[]> {
    return this.postModel
      .find({
        ...(after ? { [sortBy]: { $lt: after } } : null),
      })
      .sort({ [sortBy]: -1 })
      .limit(amount)
      .lean<Post>();
  }

  async countAfter(query: { createdAt?: Date }): Promise<number> {
    return this.postModel.countDocuments({
      ...(query.createdAt ? { createdAt: { $lt: query.createdAt } } : null),
    });
  }
}
