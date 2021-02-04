import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feed } from './contracts';
import { Model, Document } from 'mongoose';
import { FeedTags } from 'src/users/contracts';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Feed.name)
    private readonly feedModel: Model<Feed & Document>,
  ) {}

  async create(newFeed: Feed): Promise<Feed> {
    const feed = await this.feedModel.create(newFeed);
    return feed.toObject();
  }

  async findSortedByDate(
    first: number,
    before: Date,
    feedTags: FeedTags,
  ): Promise<Feed[]> {
    return this.feedModel
      .find({
        ...(before ? { createdAt: { $lt: before } } : null),
        ...(feedTags.sizes.length
          ? { 'tags.size': { $in: feedTags.sizes } }
          : null),
        ...(feedTags.genders.length
          ? { 'tags.gender': { $in: feedTags.genders } }
          : null),
      })
      .sort({ createdAt: -1 })
      .limit(first)
      .lean();
  }

  async countAfter(date: Date): Promise<number> {
    return this.feedModel.countDocuments({
      ...(date ? { createdAt: { $lt: date } } : null),
    });
  }

  async deleteByPost(post: string): Promise<Feed> {
    return this.feedModel.findOneAndDelete({ post }).lean();
  }

  async deleteManyByPosts(posts: string[]): Promise<void> {
    const result = await this.feedModel.deleteMany({ post: { $in: posts } });
    if (!result.ok)
      throw new InternalServerErrorException({
        message: 'Could not delete some posts from the DB',
        posts,
      });
  }
}
