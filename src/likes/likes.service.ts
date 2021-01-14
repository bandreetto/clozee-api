import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Like } from './contracts';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<Like & Document>,
  ) {}

  async upsertLike({ _id, ...like }: Like): Promise<Like> {
    return this.likeModel.findByIdAndUpdate(_id, like, { upsert: true }).lean();
  }

  async countByPost(
    postIds: string[],
  ): Promise<{ _id: string; count: number }[]> {
    return this.likeModel.aggregate([
      {
        $match: { post: { $in: postIds } },
      },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
  }
}
