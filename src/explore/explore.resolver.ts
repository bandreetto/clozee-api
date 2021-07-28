import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { sortBy, uniq } from 'ramda';
import { ClockService } from '../common/clock/clock.service';
import { ClozeeEvent } from '../clozee-events/contracts';
import { CmsService } from '../cms/cms.service';
import { SearchCategory } from '../cms/contracts/search-category';
import { SORT_DIRECTION } from '../common/types';
import { LikesService } from '../likes/likes.service';
import { OrdersService } from '../orders/orders.service';
import { PostsService } from '../posts/posts.service';
import { UsersLoader } from '../users/users.dataloaders';
import { Explore } from './contracts/index';
import { SearchUser } from './contracts/search-user';

@Resolver(() => Explore)
export class ExploreResolver {
  constructor(
    private readonly cmsService: CmsService,
    private readonly postsService: PostsService,
    private readonly likesService: LikesService,
    private readonly ordersService: OrdersService,
    private readonly usersLoader: UsersLoader,
    private readonly clockService: ClockService,
  ) {}

  @Query(() => Explore, { description: 'Returns explore data' })
  async explore(): Promise<Explore> {
    return {
      users: [],
      categories: [],
      events: [],
    };
  }

  @ResolveField()
  async users(): Promise<SearchUser[]> {
    const [last3Posts, top3LikedUsers, top3Sellers] = await Promise.all([
      this.postsService.findLastDistinctUsersPosts(3),
      this.likesService.groupByPostOwners(3, SORT_DIRECTION.DESC),
      this.ordersService.groupBySellers(3, SORT_DIRECTION.DESC),
    ]);
    const top9users = await Promise.all(
      uniq([
        ...last3Posts.map(p => p.user as string),
        ...top3LikedUsers.map(l => l.user),
        ...top3Sellers.map(s => s.user),
      ]).map(userId => this.usersLoader.load(userId)),
    );
    return top9users.map(t9u => ({
      userId: t9u._id,
      avatarUrl: t9u.avatar,
      username: t9u.username,
    }));
  }

  @ResolveField()
  categories(): Promise<SearchCategory[]> {
    return this.cmsService.getSearchCategories();
  }

  @ResolveField()
  async events(): Promise<ClozeeEvent[]> {
    const eventsToCome = await this.cmsService.getEvents({
      endAfter: this.clockService.now(),
    });

    return sortBy(event => event.startAt, eventsToCome);
  }
}
