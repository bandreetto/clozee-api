import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { CommentCreatedPayload } from '../comments/contracts/payloads';
import { admin } from '../common/firebase-admin';
import { OrderCreatedPayload } from '../orders/contracts/payloads';
import { Post } from '../posts/contracts';
import { UsersService } from '../users/users.service';
import { v4 } from 'uuid';
import { CommentsService } from '../comments/comments.service';
import { CommentTagNotification, GroupInviteNotification, GroupPostNotification, SaleNotification } from './contracts';
import { NotificationsService } from './notifications.service';
import { PostCommentNotification } from './contracts/post-comment-notification';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';
import { GroupCreatedPayload, GroupPostCreatedPayload } from 'src/groups/contracts/payloads';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class NotificationsConsumer {
  logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
    private readonly followsService: FollowsService,
    private readonly postsService: PostsService,
    private readonly groupsService: GroupsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @OnEvent('comment.created', { async: true })
  async createTagNotifications(payload: CommentCreatedPayload) {
    try {
      if (!payload.comment.tags.length) return;
      const commentTags = payload.comment.tags as string[];
      const tagNotifications: CommentTagNotification[] = commentTags.map(userTagged => ({
        _id: v4(),
        kind: CommentTagNotification.name,
        comment: payload.comment._id,
        user: userTagged,
        unseen: true,
      }));
      const createdNotifications = await this.notificationsService.createMany(tagNotifications);
      await Promise.all(
        createdNotifications.map(notification =>
          this.pubSub.publish('notification', {
            notification,
          }),
        ),
      );
    } catch (error) {
      this.logger.error({
        message: 'Error while creating comment tag notifications',
        payload,
        error: error.toString(),
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async sendCommentTagPushNotification(payload: CommentCreatedPayload) {
    try {
      this.logger.log(`Sending comment tag push notification(s) to user(s) ${payload.comment.tags.join(', ')}`);
      const users = await this.usersService.findManyByIds([
        payload.comment.user as string,
        ...(payload.comment.tags as string[]),
      ]);
      const taggingUser = users.find(user => user._id === payload.comment.user);
      const taggedUsers = users.filter(u => u.deviceToken && u._id !== taggingUser._id);
      if (!taggedUsers.length) return;
      await admin.messaging().sendMulticast({
        tokens: taggedUsers.map(u => u.deviceToken),
        notification: {
          title: 'Clozee Friends 🧡',
          body: `@${taggingUser.username} marcou você em uma publicação`,
        },
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while sending comment tag push notifications.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async sendPushNotificationToPostOwner(payload: CommentCreatedPayload) {
    try {
      this.logger.log(
        `Sending comment created push notification to post owner ${payload.commentOwner._id} for comment ${payload.comment._id}`,
      );
      const post = await this.postsService.findById(payload.comment.post as string);
      if ((payload.comment.tags as string[]).some(tag => tag === post.user))
        return this.logger.log(
          'Skipping comment created push notification as post owner will be notified by the tag notification.',
        );
      const postOwner = await this.usersService.findById(post.user as string);
      if (!postOwner.deviceToken)
        return this.logger.log(
          'Skipping comment created push notification as post owner does not have any device token registered.',
        );
      await admin.messaging().send({
        token: postOwner.deviceToken,
        notification: {
          title: 'Tem gente querendo te dizer algo...',
          body: `@${payload.commentOwner.username} comentou na sua publicação`,
          imageUrl: post.images[0],
        },
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while sending push notification to post owner.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async createPostComentNotification(payload: CommentCreatedPayload) {
    try {
      const postCommentNotification: PostCommentNotification = {
        _id: v4(),
        comment: payload.comment._id,
        kind: PostCommentNotification.name,
        post: payload.post._id,
        unseen: true,
        user: payload.post.user as string,
      };
      const notification = await this.notificationsService.create(postCommentNotification);
      this.pubSub.publish('notification', {
        notification,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while creating post commented notification.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('order.created', { async: true })
  async createSaleNotifications(payload: OrderCreatedPayload) {
    try {
      const sellerId = payload.posts[0].user as string;
      const notification: SaleNotification = {
        _id: v4(),
        kind: SaleNotification.name,
        user: sellerId,
        order: payload.order._id,
        unseen: true,
      };
      const createdNotification = await this.notificationsService.create(notification);

      /**
       * Graphql Subscription
       */
      await this.pubSub.publish('notification', {
        notification: createdNotification,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while creating sale notifications',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('order.created', { async: true })
  async sendPushNotifications(payload: OrderCreatedPayload) {
    try {
      const sellerId = payload.posts[0].user as string;

      const seller = await this.usersService.findById(sellerId);

      if (!seller.deviceToken)
        return this.logger.warn({
          message: 'Skipping push notification as seller does not have a device token registered.',
          sellerId: seller._id,
          order: payload.order.number,
        });
      const fcmNotifications = payload.posts.map(post => ({
        token: seller.deviceToken,
        notification: {
          title: 'Parabéns! Você realizou uma venda!',
          body: `O post ${post.title} foi vendido!`,
        },
        android: {
          notification: {
            imageUrl: post.images[0],
          },
          priority: 'high' as const,
        },
      }));
      await admin.messaging().sendAll(fcmNotifications);
    } catch (error) {
      this.logger.error({
        message: 'Error while sending created order push notifications',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('post.deleted', { async: true })
  async deletePostCommentNotification(payload: Post) {
    try {
      const comments = await this.commentsService.findByPost(payload._id);
      await this.notificationsService.deleteCommentTagNotifications(comments.map(comment => comment._id));
    } catch (error) {
      this.logger.error({
        message: 'Error while deleting comments notification from post.deleted event.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('post.created', { async: true })
  async sendPushToFollowers(payload: Post) {
    try {
      this.logger.log('Sending push to followers on post created by followee.');
      const [follows, user] = await Promise.all([
        this.followsService.findManyByFollowees([payload.user as string]),
        this.usersService.findById(payload.user as string),
      ]);
      const followers = await this.usersService.findManyByIds(follows.map(f => f.follower));
      const tokens = followers.map(f => f.deviceToken).filter(t => t);
      if (!tokens.length)
        return this.logger.log(
          'Skipping push to followers on post created as there are no followers with device tokens registered.',
        );
      await admin.messaging().sendMulticast({
        tokens,
        notification: {
          title: 'Post novo na área! 🤩',
          body: `Vem cá ver o que @${user.username} acabou de postar!`,
        },
        data: {
          postId: payload._id,
        },
      });
    } catch (error) {
      this.logger.error({
        message: 'Error while sending push to followers on new post.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('group.created', { async: true })
  async createGroupInviteNotifications(payload: GroupCreatedPayload) {
    try {
      const groupInviteNotifications: GroupInviteNotification[] = payload.participants
        .filter(participant => participant !== payload.groupCreator._id)
        .map(participant => ({
          _id: v4(),
          kind: GroupInviteNotification.name,
          user: participant,
          group: payload.group._id,
          inviter: payload.groupCreator._id,
          unseen: true,
        }));
      const createdNotifications = await this.notificationsService.createMany(groupInviteNotifications);
      await Promise.all(
        createdNotifications.map(notification => this.pubSub.publish('notification', { notification })),
      );
    } catch (error) {
      this.logger.error({
        message: 'Error while sending push to group invitees',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('group-post.created', { async: true })
  async createGroupPostNotifications(payload: GroupPostCreatedPayload) {
    try {
      const allParticipants = await this.groupsService.findParticipantsByGroupId(payload.group._id);
      const participantsToBeNotified = allParticipants.filter(participant => participant._id !== payload.postOwner._id);
      const groupPostNotifications: GroupPostNotification[] = participantsToBeNotified
        .filter(participant => participant._id !== payload.postOwner._id)
        .map(participant => ({
          _id: v4(),
          kind: GroupPostNotification.name,
          user: participant.user,
          group: payload.group._id,
          postOwner: payload.postOwner._id,
          unseen: true,
        }));
      const createdNotifications = await this.notificationsService.createMany(groupPostNotifications);
      await Promise.all(
        createdNotifications.map(notification => this.pubSub.publish('notification', { notification })),
      );
    } catch (error) {
      this.logger.error({
        message: 'Error to create group post added notification',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
