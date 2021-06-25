import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { SORT_DIRECTION } from 'src/common/types';
import { Like } from './contracts';

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private readonly likeModel: Model<Like & Document>) {}

  async findManyByIds(ids: string[]): Promise<Like[]> {
    return this.likeModel.find({ _id: { $in: ids }, deleted: false }).lean();
  }

  async findLikesAfter(date: Date): Promise<Like[]> {
    return this.likeModel.find({ createdAt: { $gt: date }, deleted: false }).lean();
  }

  async groupByPostOwners(limit: number, sort: SORT_DIRECTION): Promise<{ user: string; likesCount: number }[]> {
    const userLikes = await this.likeModel.aggregate<{ _id: [string]; likesCount: number }>([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'populatedPost',
        },
      },
      {
        $group: {
          _id: '$populatedPost.user',
          likesCount: { $sum: 1 },
        },
      },
      { $sort: { likesCount: sort } },
      { $limit: limit },
    ]);

    return userLikes.map(ul => ({ user: ul._id[0], likesCount: ul.likesCount }));
  }

  async upsertLike({ _id, ...like }: Like): Promise<Like> {
    return this.likeModel.findByIdAndUpdate(_id, like, { upsert: true, new: true }).lean();
  }

  async countByPosts(postIds: string[]): Promise<{ _id: string; count: number }[]> {
    return this.likeModel.aggregate([
      {
        $match: { post: { $in: postIds }, deleted: false },
      },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
  }
}
