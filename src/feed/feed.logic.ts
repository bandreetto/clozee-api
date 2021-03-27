import { Connection } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { Feed } from './contracts';

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
