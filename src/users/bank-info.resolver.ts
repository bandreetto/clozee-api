import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { BanksService } from './banks.service';
import { Bank, BankInfo } from './contracts';

@Resolver(() => BankInfo)
export class BankInfoResolver {
  constructor(private readonly banksService: BanksService) {}

  @ResolveField()
  async bank(@Root() bankInfo: BankInfo): Promise<Bank> {
    if (typeof bankInfo.bank !== 'string') return bankInfo.bank;
    return this.banksService.findById(bankInfo.bank);
  }
}
