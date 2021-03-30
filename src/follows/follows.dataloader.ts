import { Injectable, Scope } from '@nestjs/common';
import { Follow } from './contracts';
import { FollowsService } from './follows.service';
import DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export class FollowsLoader {
  constructor(private readonly followsService: FollowsService) {}

  byFollowee = new DataLoader<string, Follow[]>((followeesIds: string[]) =>
    this.followsService
      .findManyByFollowees(followeesIds)
      .then(follows =>
        followeesIds.map(followeeId =>
          follows.filter(follow => follow.followee === followeeId),
        ),
      ),
  );

  byFollower = new DataLoader<string, Follow[]>((followersIds: string[]) =>
    this.followsService
      .findManyByFollowers(followersIds)
      .then(follows =>
        followersIds.map(followerId =>
          follows.filter(follow => follow.follower === followerId),
        ),
      ),
  );
}
