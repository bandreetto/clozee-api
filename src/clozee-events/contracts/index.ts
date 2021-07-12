import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Post } from '../../posts/contracts';

@ObjectType()
export class ClozeeEvent {
  @Field(() => Int)
  id: number;
  @Field()
  title: string;
  @Field({ description: 'The url for the event banner midia.' })
  bannerUrl: string;
  @Field()
  startAt: Date;
  @Field()
  endAt: Date;
  @Field(() => [Post], { description: 'The posts featured on this event.' })
  posts: Post[];
}
