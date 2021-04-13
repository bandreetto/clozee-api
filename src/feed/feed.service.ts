import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feed } from './contracts';
import { Model, Document } from 'mongoose';
import { FeedTags, User } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { SIZES } from 'src/posts/contracts/enums';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Feed.name)
    private readonly feedModel: Model<Feed & Document>,
    @InjectModel(User.name) private readonly usersModel: Model<User & Document>,
  ) {}

  async create(
    { _id, ...newFeed }: Omit<Feed, 'user'>,
    followingUsers: string[],
    followingPoints: number,
  ): Promise<void> {
    await this.usersModel.aggregate([
      {
        $replaceWith: {
          _id: {
            $concat: [_id, ':', '$_id'],
          },
          user: '$_id',
          ...newFeed,
        },
      },
      {
        $addFields: {
          score: {
            $cond: {
              if: { $in: ['$user', followingUsers] },
              then: { $add: ['$score', followingPoints] },
              else: '$score',
            },
          },
        },
      },
      {
        $merge: {
          into: 'feeds',
          on: '_id',
        },
      },
    ]);
  }

  async findByPost(postId: string): Promise<Feed> {
    return this.feedModel.findOne({ post: postId }).lean();
  }

  async findByPosts(postsIds: string[], user: string): Promise<Feed[]> {
    return this.feedModel.find({ post: { $in: postsIds }, user }).lean();
  }

  async findSortedByScore(
    user: string,
    first: number,
    cursor?: { maxScore: number; before: Date },
    feedTags?: FeedTags,
    blacklistedPosts: string[] = [],
  ): Promise<Feed[]> {
    return this.feedModel
      .find({
        user,
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
    user: string,
    tags: FeedTags,
    cursor?: { maxScore: number; before: Date },
    blacklistedPosts: string[] = [],
  ): Promise<number> {
    return this.feedModel.countDocuments({
      user,
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
    user: string,
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
        $match: {
          user,
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
    user: string,
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
        $match: {
          user,
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

  async increaseManyScoresBy(amount: number, feedIds: string[]) {
    return this.feedModel.updateMany(
      {
        _id: { $in: feedIds },
      },
      {
        $inc: {
          score: amount,
        },
      },
    );
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
