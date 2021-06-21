import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common/guards';
import { ExploreCategory } from './contracts/index';

@Resolver()
export class ExploreResolver {
  constructor() {}

  @UseGuards(AuthGuard)
  @Query(() => [ExploreCategory], { description: 'Returns explore data' })
  explore(): Promise<ExploreCategory[]> {
    return null;
  }
}
