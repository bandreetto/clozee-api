import { Connection } from 'src/common/types';
import { Post } from 'src/posts/contracts';

export function fromPostsToConnection(
  posts: Post[],
  hasNextPage: boolean,
): Connection<Post> {
  const edges = posts.map(post => ({
    cursor: Buffer.from(post.createdAt.toString()).toString('base64'),
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
