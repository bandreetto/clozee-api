import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { TokenUser } from 'src/common/types';
import { User } from 'src/users/contracts';
import { AuthGuard } from '../common/guards/auth.guard';
import { FollowsService } from './follows.service';
import { UsersService } from 'src/users/users.service';
import { EventEmitter2 } from 'eventemitter2';

@Resolver()
export class FollowsResolver {
  constructor(
    private readonly followsService: FollowsService,
    private readonly usersService: UsersService,
    private readonly eventEmmiter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async follow(
    @Args('userId') followee: string,
    @CurrentUser() follower: TokenUser,
  ): Promise<User> {
    const follow = await this.followsService.upsertFollow({
      _id: `${follower._id}:${followee}`,
      follower: follower._id,
      followee,
      deleted: false,
    });

    this.eventEmmiter.emit('follow.created', follow);
    return this.usersService.findById(followee);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => User)
  async unfollow(
    @Args('userId') followee: string,
    @CurrentUser() follower: TokenUser,
  ) {
    const follow = await this.followsService.upsertFollow({
      _id: `${follower._id}:${followee}`,
      follower: follower._id,
      followee,
      deleted: true,
    });

    this.eventEmmiter.emit('follow.deleted', follow);
    return this.usersService.findById(followee);
  }
}
