import { Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { User } from 'src/users/contracts';
import { UsersLoader } from 'src/users/users.dataloaders';
import { Trend } from './contracts';

@Resolver(() => Trend)
export class TrendsResolver {
  constructor(private readonly usersLoader: UsersLoader) {}

  @Query(() => [Trend])
  async trends(): Promise<Trend[]> {
    return [
      {
        id: 1,
        user: '11fb881a-db5f-43af-b3af-cda6ec728420',
        title: 'Você não vai acreditar nessas dicas 😱',
        description:
          'Olha só essas 8 tendências! A 3 já conquistou meu ❤️ \nhttps://stealthelook.com.br/8-tendencias-de-moda-que-estou-roubando-das-celebridades/',
        createdAt: new Date(),
      },
    ];
  }

  @ResolveField()
  async user(@Root() trend: Trend): Promise<User> {
    console.log({ trend });
    if (typeof trend.user !== 'string') return trend.user;
    return this.usersLoader.load(trend.user);
  }
}
