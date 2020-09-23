import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Post } from './contracts/domain';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post & Document>,
  ) {}

  async create(post: Post): Promise<Post> {
    const newPost = await this.postModel.create(post);
    return newPost.toObject();
  }

  async findManyByUser(userId: string): Promise<Post[]> {
    return this.postModel.find({ user: userId }).lean();
  }

  async findById(postId: string): Promise<Post> {
    return this.postModel.findById(postId).lean();
  }
}
