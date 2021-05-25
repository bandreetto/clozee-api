import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { SeenPost } from './contracts/seen-post';
import { PostBlacklist } from './contracts/post-blacklist';

@Injectable()
export class SeenPostService {
  constructor(
    @InjectModel(SeenPost.name)
    private readonly seenPostModel: Model<SeenPost & Document>,
    @InjectModel(PostBlacklist.name)
    private readonly postBlacklistModel: Model<PostBlacklist & Document>,
  ) {}

  async create(seenPost: SeenPost): Promise<SeenPost> {
    const createdSeenPost = await this.seenPostModel.create(seenPost);
    return createdSeenPost.toObject();
  }

  async findBlacklistedPosts(_id: string): Promise<PostBlacklist> {
    return this.postBlacklistModel.findById(_id).lean();
  }

  async getSessionPosts(sessionId: string): Promise<SeenPost[]> {
    return this.seenPostModel.find({ session: sessionId }).lean()
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

  async clearBlacklist(userId: string): Promise<PostBlacklist> {
    return this.postBlacklistModel
      .findByIdAndUpdate(userId, {
        $set: { posts: [] },
      })
      .lean();
  }

  async addToBlockedUserPosts(
    userId: string,
    posts: string[],
  ): Promise<PostBlacklist> {
    return this.postBlacklistModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { blockedUsersPosts: { $each: posts } },
      },
      { new: true },
    );
  }
}
