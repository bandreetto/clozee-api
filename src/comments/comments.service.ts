import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Comment } from './contracts';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment & Document>,
  ) {}

  async create(comment: Comment): Promise<Comment> {
    const newComment = await this.commentModel.create(comment);
    return newComment;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentModel.find({ post: postId }).lean();
  }

  async findByPosts(postsIds: string[]): Promise<Comment[]> {
    return this.commentModel.find({ post: { $in: postsIds } }).lean();
  }

  async findManyByIds(commentIds: string[]): Promise<Comment[]> {
    return this.commentModel.find({ _id: { $in: commentIds } }).lean();
  }

  async countByPost(postId: string): Promise<number> {
    return this.commentModel.find({ post: postId }).countDocuments();
  }

  async countByPosts(
    postIds: string[],
  ): Promise<{ _id: string; count: number }[]> {
    return this.commentModel.aggregate([
      {
        $match: { post: { $in: postIds } },
      },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
  }
}
