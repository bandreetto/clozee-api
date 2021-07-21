import { Category } from '../categories/contracts';
import { FEMALE_CATEGORY_ID, MALE_CATEGORY_ID } from '../common/contants';
import { Connection } from '../common/types';
import { Post } from '../posts/contracts';
import { GENDER_TAGS } from '../users/contracts/enum';
import { UserFeed } from './contracts';
import { Tags } from './contracts/tags';

export function encodeCursor(date: Date, score = 0): string {
  const cursor = `${date.toISOString()}_${score}`;
  return Buffer.from(cursor).toString('base64');
}

export function decodeCursor(cursor: string): [date: Date, score: number] {
  const decodedCursor = Buffer.from(cursor, 'base64').toString();
  const [date, score] = decodedCursor.split('_');
  return [new Date(date), Number(score)];
}

export function fromPostsToConnection(
  posts: { feedPost: UserFeed; post: Post; score?: number }[],
  hasNextPage: boolean,
): Connection<Post> {
  const edges = posts.map(({ feedPost, post }) => ({
    cursor: encodeCursor(feedPost.createdAt, feedPost.score),
    node: post,
  }));
  return {
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage,
    },
  };
}

export function getPostScore(post: Post, numberOfLikes: number, numberOfComments: number, followingIds?: string[]) {
  let score = 0;
  score += numberOfLikes;
  score += numberOfComments;
  const postOwner = typeof post.user === 'string' ? post.user : post.user._id;
  if (followingIds?.includes(postOwner)) score += 20;
  return score;
}

export function getFeedTags(post: Post, postCategory: Category, parentCategories: Category[]): Tags {
  let gender: GENDER_TAGS;
  const postCategoryParentsIds = parentCategories.map(c => c._id);
  if (postCategoryParentsIds.includes(MALE_CATEGORY_ID)) gender = GENDER_TAGS.MALE;
  else if (postCategoryParentsIds.includes(FEMALE_CATEGORY_ID)) gender = GENDER_TAGS.FEMALE;
  else gender = GENDER_TAGS.NEUTRAL;

  return {
    size: post.size,
    gender,
    searchTerms: [post.title, post.description, postCategory.name, ...parentCategories.map(c => c.name)],
  };
}
