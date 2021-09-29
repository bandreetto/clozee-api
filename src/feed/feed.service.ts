import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { SIZES } from '../posts/contracts/enums';
import { FeedTags } from '../users/contracts';
import { GENDER_TAGS } from '../users/contracts/enum';
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

  async searchByTerm(
    searchTerm: string,
    tags: FeedTags,
    limit: number,
    maxScore = Infinity,
    createdBefore?: Date,
    blacklistedPosts: string[] = [],
  ): Promise<Feed[]> {
    return this.feedModel.aggregate([
      {
        $search: {
          index: 'feedsSearch',
          text: {
            path: 'tags.searchTerms',
            query: searchTerm,
          },
        },
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' },
        },
      },
      {
        $match: {
          ...(createdBefore ? { createdAt: { $lt: createdBefore } } : null),
          'tags.size': {
            $in: tags.sizes.length ? tags.sizes : Object.values(SIZES),
          },
          'tags.gender': {
            $in: tags.genders.length ? tags.genders : Object.values(GENDER_TAGS),
          },
          post: { $nin: blacklistedPosts },
          score: { $lt: maxScore },
        },
      },
      {
        $sort: {
          score: -1,
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);
  }

  async countBySearchTerm(
    searchTerm: string,
    tags: FeedTags,
    maxScore = Infinity,
    createdBefore?: Date,
    blacklistedPosts: string[] = [],
  ): Promise<number> {
    const [result] = await this.feedModel.aggregate([
      {
        $search: {
          index: 'feedsSearch',
          text: {
            path: 'tags.searchTerms',
            query: searchTerm,
          },
        },
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' },
        },
      },
      {
        $match: {
          ...(createdBefore ? { createdAt: { $lt: createdBefore } } : null),
          'tags.size': {
            $in: tags.sizes.length ? tags.sizes : Object.values(SIZES),
          },
          'tags.gender': {
            $in: tags.genders.length ? tags.genders : Object.values(GENDER_TAGS),
          },
          post: { $nin: blacklistedPosts },
          score: { $lt: maxScore },
        },
      },
      {
        $count: 'searchCount',
      },
    ]);
    return result?.searchCount || 0;
  }
}
