import { Inject, UseGuards, ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { Notification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PubSub } from 'graphql-subscriptions';
import { JwtService } from '@nestjs/jwt';
import { Token } from 'src/auth/contracts';
import { isAccessToken } from 'src/auth/auth.logic';

/**
 * 5 hours in seconds => 5 hours * 60 minutes * 60 seconds
 */
const FIVE_HOURS = 5 * 60 * 60;
@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @Subscription(() => Notification, {
    filter: (
      payload: { notification: Notification },
      variables: { token: string; userId: string },
    ) => {
      return payload?.notification?.user === variables.userId;
    },
  })
  async notification(
    @Args('token') token: string,
    @Args('userId') userId: string,
  ) {
    const decodedToken = await this.jwtService.verifyAsync<Token>(token, {
      complete: true,
      clockTolerance: FIVE_HOURS,
    });
    if (!isAccessToken(decodedToken)) throw new ForbiddenException();
    if (decodedToken.payload.sub !== userId) throw new ForbiddenException();
    return this.pubSub.asyncIterator('notification');
  }

  @UseGuards(AuthGuard)
  @Query(() => [Notification])
  notifications(@CurrentUser() tokenUser: TokenUser): Promise<Notification[]> {
    return this.notificationsService.findByUser(tokenUser._id);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [Notification], {
    description: 'Mark all user notifications as seen.',
  })
  async clearNotifications(
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Notification[]> {
    await this.notificationsService.updateManyByUser(tokenUser._id, {
      unseen: false,
    });

    return this.notificationsService.findByUser(tokenUser._id);
  }
}
