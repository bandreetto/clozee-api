import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { SeenPost } from './contracts/seen-post';

@Injectable()
export class SeenPostService {
  constructor(
    @InjectModel(SeenPost.name)
    private readonly seenPostModel: Model<SeenPost & Document>,
  ) {}

  async create(seenPost: SeenPost): Promise<SeenPost> {
    const createdSeenPost = await this.seenPostModel.create(seenPost);
    return createdSeenPost.toObject();
  }

  async mergeSessionPostsToBlacklist(
    sessionId: string,
    sessionUserId: string,
  ): Promise<void> {
    await this.seenPostModel.aggregate([
      {
        $match: {
          session: sessionId,
        },
      },
      {
        $addFields: {
          user: sessionUserId,
        },
      },
      {
        $group: {
          _id: '$user',
          user: { $first: '$user' },
          posts: { $push: '$post' },
        },
      },
      {
        $merge: {
          into: 'postblacklists',
          whenMatched: [
            {
              $addFields: {
                posts: { $setUnion: ['$posts', '$$new.posts'] },
              },
            },
          ],
        },
      },
    ]);
  }
}
