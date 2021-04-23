import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Feed } from './contracts';

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
}
