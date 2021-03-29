import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feed } from './contracts';
import { Model, Document } from 'mongoose';
import { FeedTags } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { SIZES } from 'src/posts/contracts/enums';

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

  async findByPost(postId: string): Promise<Feed> {
    return this.feedModel.findOne({ post: postId }).lean();
  }

  async findSortedByScore(
    first: number,
    cursor?: { maxScore: number; before: Date },
    feedTags?: FeedTags,
    blacklistedPosts: string[] = [],
  ): Promise<Feed[]> {
    return this.feedModel
      .find({
        ...(cursor
          ? {
              $or: [
                { score: cursor.maxScore, createdAt: { $lt: cursor.before } },
                { score: { $lt: cursor.maxScore } },
                { score: 0, createdAt: { $lt: cursor.before } },
              ],
            }
          : null),
        ...(feedTags.sizes.length
          ? { 'tags.size': { $in: feedTags.sizes } }
          : { 'tags.size': { $in: Object.values(SIZES) } }),
        ...(feedTags.genders.length
          ? { 'tags.gender': { $in: feedTags.genders } }
          : { 'tags.gender': { $in: Object.values(GENDER_TAGS) } }),
        post: { $nin: blacklistedPosts },
      })
      .sort({ score: -1, createdAt: -1 })
      .limit(first)
      .lean();
  }

  async countByScore(
    tags: FeedTags,
    cursor?: { maxScore: number; before: Date },
    blacklistedPosts: string[] = [],
  ): Promise<number> {
    return this.feedModel.countDocuments({
      ...(cursor
        ? {
            $or: [
              { score: cursor.maxScore, createdAt: { $lt: cursor.before } },
              { score: { $lt: cursor.maxScore } },
              { score: 0, createdAt: { $lt: cursor.before } },
            ],
          }
        : null),
      ...(tags.sizes.length
        ? { 'tags.size': { $in: tags.sizes } }
        : { 'tags.size': { $in: Object.values(SIZES) } }),
      ...(tags.genders.length
        ? { 'tags.gender': { $in: tags.genders } }
        : { 'tags.gender': { $in: Object.values(GENDER_TAGS) } }),
      post: { $nin: blacklistedPosts },
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
          searchScore: { $meta: 'searchScore' },
        },
      },
      {
        $match: {
          ...(createdBefore ? { createdAt: { $lt: createdBefore } } : null),
          'tags.size': {
            $in: tags.sizes.length ? tags.sizes : Object.values(SIZES),
          },
          'tags.gender': {
            $in: tags.genders.length
              ? tags.genders
              : Object.values(GENDER_TAGS),
          },
          post: { $nin: blacklistedPosts },
          searchScore: { $lt: maxScore },
        },
      },
      {
        $sort: {
          searchScore: -1,
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
            $in: tags.genders.length
              ? tags.genders
              : Object.values(GENDER_TAGS),
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

  async updateScore(feedId: string, newScore: number): Promise<Feed> {
    return this.feedModel
      .findByIdAndUpdate(feedId, { $set: { score: newScore } })
      .lean();
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
