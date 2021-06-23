import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common/guards';
import { Explore } from './contracts/index';
import { CmsService } from '../cms/cms.service';

@Resolver()
export class ExploreResolver {
  constructor(private readonly cmsService: CmsService) {}

  @UseGuards(AuthGuard)
  @Query(() => Explore, { description: 'Returns explore data' })
  async explore(): Promise<Explore> {
    return {
      users: [],
      categories: await this.cmsService.getSearchCategories(),
    };
  }
}
