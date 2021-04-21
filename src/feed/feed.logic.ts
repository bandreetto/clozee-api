import { Category } from 'src/categories/contracts';
import { Connection } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { GENDER_TAGS } from 'src/users/contracts/enum';
import { Feed } from './contracts';
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
  posts: { feedPost: Feed; post: Post, score?: number }[],
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
  const postOwner = typeof post.user === 'string' ? post.user : post.user._id
  if (followingIds?.includes(postOwner)) score += 20;
  return score;
}


const FEMALE_CATEGORY_ID = 'b6877a2b-163b-4099-958a-17d74604ceed';
const MALE_CATEGORY_ID = '1b7f9f9d-ab18-4597-ab94-4dc19968208a';
export function getFeedTags(post: Post, postCategory: Category, parentCategories: Category[]): Tags {
  let gender: GENDER_TAGS;
  const postCategoryParentsIds = parentCategories.map(c => c._id);
  if (postCategoryParentsIds.includes(MALE_CATEGORY_ID))
    gender = GENDER_TAGS.MALE;
  else if (postCategoryParentsIds.includes(FEMALE_CATEGORY_ID))
    gender = GENDER_TAGS.FEMALE;
  else gender = GENDER_TAGS.NEUTRAL;

  return {
    size: post.size,
    gender,
    searchTerms: [
      post.title,
      post.description,
      postCategory.name,
      ...parentCategories.map(c => c.name),
    ],
  }
}
