import { Query, Resolver } from '@nestjs/graphql';
import { SearchCategory } from './contracts';
import { CmsService } from './cms.service';

@Resolver()
export class CmsResolver {
  constructor(private readonly cmsService: CmsService) {}

  @Query(() => [SearchCategory])
  searchCategories(): Promise<SearchCategory[]> {
    return this.cmsService.getSearchCategories();
  }
}
