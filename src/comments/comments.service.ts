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
}
