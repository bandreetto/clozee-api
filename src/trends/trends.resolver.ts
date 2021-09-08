import { Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CmsService } from 'src/cms/cms.service';
import { User } from 'src/users/contracts';
import { UsersLoader } from 'src/users/users.dataloaders';
import { Trend } from './contracts';

@Resolver(() => Trend)
export class TrendsResolver {
  constructor(private readonly usersLoader: UsersLoader, private readonly cmsService: CmsService) {}

  @Query(() => [Trend])
  async trends(): Promise<Trend[]> {
    const trends = await this.cmsService.getTrends();
    return trends.map(trend => ({
      ...trend,
      user: trend.user || 'clozee-trends-user',
    }));
  }

  @ResolveField()
  async user(@Root() trend: Trend): Promise<User> {
    if (typeof trend.user !== 'string') return trend.user;
    return this.usersLoader.load(trend.user);
  }
}
