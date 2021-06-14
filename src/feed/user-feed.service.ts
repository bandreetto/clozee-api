import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feed, UserFeed } from './contracts';
import { Model, Document } from 'mongoose';
import { FeedTags, User } from 'src/users/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { SIZES } from 'src/posts/contracts/enums';

@Injectable()
export class UserFeedService {
  constructor(
    @InjectModel(UserFeed.name)
    private readonly userFeedModel: Model<UserFeed & Document>,
    @InjectModel(User.name) private readonly usersModel: Model<User & Document>,
    @InjectModel(Feed.name) private readonly feedModel: Model<Feed & Document>,
  ) {}

  async createManyPerFeed(user: string, followingUsers: string[], followingPoints: number): Promise<void> {
    await this.feedModel.aggregate([
      {
        $addFields: {
          _id: {
            $concat: ['$post', ':', user],
          },
          user,
          score: {
            $cond: {
              if: { $in: ['$postOwner', followingUsers] },
              then: { $add: ['$score', followingPoints] },
              else: '$score',
            },
          },
        },
      },
      {
        $unset: 'postOwner',
      },
      {
        $merge: {
          into: 'userfeeds',
          on: '_id',
        },
      },
    ]);
  }

  async createManyPerUser(
    { _id, ...newFeed }: Omit<UserFeed, 'user'>,
    followingUsers: string[],
    followingPoints: number,
  ): Promise<void> {
    await this.usersModel.aggregate([
      {
        $replaceWith: {
          _id: {
            $concat: [newFeed.post, ':', '$_id'],
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
          into: 'userfeeds',
          on: '_id',
        },
      },
    ]);
  }

  async findByPost(postId: string): Promise<UserFeed[]> {
    return this.userFeedModel.find({ post: postId }).lean();
  }

  async findByPosts(postsIds: string[], user: string): Promise<UserFeed[]> {
    return this.userFeedModel.find({ post: { $in: postsIds }, user }).lean();
  }

  async findSortedByScore(
    user: string,
    first: number,
    cursor?: { maxScore: number; before: Date },
    feedTags?: FeedTags,
    blacklistedPosts: string[] = [],
  ): Promise<UserFeed[]> {
    return this.userFeedModel
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
    return this.userFeedModel.countDocuments({
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
      ...(tags.sizes.length ? { 'tags.size': { $in: tags.sizes } } : { 'tags.size': { $in: Object.values(SIZES) } }),
      ...(tags.genders.length
        ? { 'tags.gender': { $in: tags.genders } }
        : { 'tags.gender': { $in: Object.values(GENDER_TAGS) } }),
      post: { $nin: blacklistedPosts },
    });
  }

  async addToScores(amount: number, feedIds: string[]): Promise<void> {
    return this.userFeedModel.updateMany(
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

  async addToScoreByPost(amount: number, postId: string): Promise<void> {
    return this.userFeedModel.updateMany(
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

  async deleteByPost(post: string): Promise<void> {
    await this.userFeedModel.deleteMany({ post }).lean();
  }

  async deleteManyByPosts(posts: string[], user?: string): Promise<void> {
    const result = await this.userFeedModel.deleteMany({
      post: { $in: posts },
      ...(user && { user }),
    });
    if (!result.ok)
      throw new InternalServerErrorException({
        message: 'Could not delete some posts from the DB',
        posts,
      });
  }
}
