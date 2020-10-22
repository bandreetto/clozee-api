import { Field, ObjectType } from '@nestjs/graphql';
import { Connection, Edge, PageInfo } from 'src/common/types';
import { Post } from 'src/posts/contracts/domain';

@ObjectType()
export class FeedPostEdge implements Edge<Post> {
  @Field(() => Post)
  node: Post;
  @Field({ description: 'An opaque cursor representing this edge position.' })
  cursor: string;
}

@ObjectType()
export class FeedPostConnection implements Connection<Post> {
  @Field(() => [FeedPostEdge], {
    description:
      'An array of post edges containing the node (Post) and its cursor.',
  })
  edges: FeedPostEdge[];
  @Field()
  pageInfo: PageInfo;
}
