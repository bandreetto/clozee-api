import { Field, ObjectType } from '@nestjs/graphql';
import { Connection, Edge, PageInfo } from '../../common/types';
import { Post } from '../../posts/contracts';

@ObjectType()
export class FeedPostEdge implements Edge<Post> {
  @Field(() => Post)
  node: Post;
  @Field({ description: 'An opaque cursor representing this edge position.' })
  cursor: string;
  @Field({ description: 'The score of this post for this user.' })
  score: number;
}

@ObjectType()
export class FeedPostConnection implements Connection<Post> {
  @Field(() => [FeedPostEdge], {
    description: 'An array of post edges containing the node (Post) and its cursor.',
  })
  edges: FeedPostEdge[];
  @Field()
  pageInfo: PageInfo;
}
