import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common/guards';
import { BanksService } from './banks.service';
import { Bank } from './contracts';

@Resolver(() => Bank)
export class BanksResolver {
  constructor(private readonly banksService: BanksService) {}

  @UseGuards(AuthGuard)
  @Query(() => [Bank])
  banks(): Promise<Bank[]> {
    return this.banksService.find();
  }
}
