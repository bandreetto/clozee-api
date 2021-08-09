import { Inject, UseGuards, ForbiddenException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { TokenUser } from '../common/types';
import { Notification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PubSub } from 'graphql-subscriptions';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../auth/contracts';
import { isAccessToken } from '../auth/auth.logic';
import { NOTIFICATION_KINDS, NOTIFICATION_ENUM_TO_KIND_MAPPER } from './contracts/enums';

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
      variables: {
        token: string;
        userId: string;
        notificationKinds: NOTIFICATION_KINDS[];
      },
    ) => {
      const notificationKindsValues = variables.notificationKinds.map(
        enumValue => NOTIFICATION_ENUM_TO_KIND_MAPPER[enumValue],
      );
      if (!notificationKindsValues.includes(payload?.notification?.kind)) return false;
      return payload?.notification?.user === variables.userId;
    },
  })
  async notification(
    @Args('token') token: string,
    @Args('userId') userId: string,
    @Args('notificationKinds', {
      description:
        'The kinds of notification to return. If this argument is ommited, the service will return the comment tag and sale notification for compatibility with older versions.',
      type: () => [NOTIFICATION_KINDS],
      /**
       * Use these as default to support old versions of the app.
       */
      defaultValue: [NOTIFICATION_KINDS.COMMENT_TAG, NOTIFICATION_KINDS.SALE],
    })
    _notificationKindsEnum: NOTIFICATION_KINDS[],
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
  async notifications(
    @Args('notificationKinds', {
      description:
        'The kinds of notification to return. If this argument is ommited, the service will return the comment tag and sale notification for compatibility with older versions.',
      type: () => [NOTIFICATION_KINDS],
      /**
       * Use these as default to support old versions of the app.
       */
      defaultValue: [NOTIFICATION_KINDS.COMMENT_TAG, NOTIFICATION_KINDS.SALE],
    })
    notificationKindsEnum: NOTIFICATION_KINDS[],
    @CurrentUser()
    tokenUser: TokenUser,
  ): Promise<Notification[]> {
    const notifications = await this.notificationsService.findByUser(tokenUser._id);
    const notificationKinds = notificationKindsEnum.map(enumValue => NOTIFICATION_ENUM_TO_KIND_MAPPER[enumValue]);
    return notifications.filter(notification => notificationKinds.includes(notification.kind));
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [Notification], {
    description: 'Mark all user notifications as seen.',
  })
  async clearNotifications(@CurrentUser() tokenUser: TokenUser): Promise<Notification[]> {
    await this.notificationsService.updateManyByUser(tokenUser._id, {
      unseen: false,
    });

    return this.notificationsService.findByUser(tokenUser._id);
  }
}
