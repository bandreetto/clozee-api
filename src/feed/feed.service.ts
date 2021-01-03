import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feed } from './contracts';
import { Model, Document } from 'mongoose';

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

  async findSortedByDate(first: number, before: Date): Promise<Feed[]> {
    return this.feedModel
      .find({
        ...(before ? { createdAt: { $lt: before } } : null),
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
}
