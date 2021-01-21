import { Connection } from 'src/common/types';
import { Post } from 'src/posts/contracts';
import { Feed } from './contracts';

export function fromPostsToConnection(
  posts: { feedPost: Feed; post: Post }[],
  hasNextPage: boolean,
): Connection<Post> {
  const edges = posts.map(({ feedPost, post }) => ({
    cursor: Buffer.from(feedPost.createdAt.toString()).toString('base64'),
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
