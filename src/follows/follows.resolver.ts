import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { User } from 'src/users/contracts';
import { AuthGuard } from '../common/guards/auth.guard';
import { FollowsService } from './follows.service';
import { UsersService } from 'src/users/users.service';

@Resolver()
export class FollowsResolver {
  constructor(
    private readonly followsService: FollowsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async follow(
    @Args('userId') followee: string,
    @CurrentUser() follower: TokenUser,
  ): Promise<User> {
    await this.followsService.upsertFollow({
      _id: `${follower._id}:${followee}`,
      follower: follower._id,
      followee,
      deleted: false,
    });

    return this.usersService.findById(followee);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async unfollow(
    @Args('userId') followee: string,
    @CurrentUser() follower: TokenUser,
  ) {
    await this.followsService.upsertFollow({
      _id: `${follower._id}:${followee}`,
      follower: follower._id,
      followee,
      deleted: true,
    });

    return this.usersService.findById(followee);
  }
}
