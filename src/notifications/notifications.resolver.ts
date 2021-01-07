import { Inject, UseGuards } from '@nestjs/common';
import { Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { AuthorizedConnectionContext, TokenUser } from 'src/common/types';
import { Notification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PubSub } from 'graphql-subscriptions';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @UseGuards(AuthGuard)
  @Subscription(() => Notification, {
    filter: (
      payload: { notification: Notification },
      _variables,
      connectionContext: AuthorizedConnectionContext,
    ) =>
      payload.notification.user ===
      connectionContext.connection.context.user._id,
  })
  notification() {
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
