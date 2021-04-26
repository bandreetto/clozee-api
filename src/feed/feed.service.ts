import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  async deleteByPost(post: string): Promise<void> {
    await this.feedModel.deleteOne({ post }).lean();
  }

  async addToScoreByPost(amount: number, postId: string): Promise<void> {
    await this.feedModel.updateOne(
      {
        post: postId,
      },
      {
        $inc: {
          score: amount,
        },
      },
    );
  }

  async deleteManyByPosts(posts: string[]): Promise<void> {
    const result = await this.feedModel.deleteMany({
      post: { $in: posts },
    });
    if (!result.ok)
      throw new InternalServerErrorException({
        message: 'Could not delete some posts from the DB',
        posts,
      });
  }
}
