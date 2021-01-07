import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PubSub } from "graphql-subscriptions";
import { CommentCreatedPayload } from "src/comments/contracts/payloads";
import { OrderCreatedPayload } from "src/orders/contracts/payloads";
import { Post } from "src/posts/contracts";
import { v4 } from "uuid";
import { CommentTagNotification, SaleNotification } from "./contracts";
import { NotificationsService } from "./notifications.service";
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class NotificationsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly commentsService: CommentsService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  @OnEvent('comment.created')
  async handleCommentCreated(payload: CommentCreatedPayload) {
    if (!payload.comment.tags.length) return;
    const commentTags = payload.comment.tags as string[];
    const tagNotifications: CommentTagNotification[] = commentTags.map(
      userTagged => ({
        _id: v4(),
        kind: CommentTagNotification.name,
        comment: payload.comment._id,
        user: userTagged,
        unseen: true,
      }),
    );
    const createdNotifications = await this.notificationsService.createMany(
      tagNotifications,
    );
    createdNotifications.map(notification =>
      this.pubSub.publish('notification', {
        notification,
      }),
    );
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedPayload) {
    const seller = payload.posts[0].user as string;
    const notification: SaleNotification = {
      _id: v4(),
      kind: SaleNotification.name,
      user: seller,
      order: payload.order._id,
      unseen: true,
    };
    const createdNotification = await this.notificationsService.create(
      notification,
    );
    this.pubSub.publish('notification', {
      notification: createdNotification,
    });
  }

  @OnEvent('post.deleted')
  async deletePostCommentNotification(payload: Post) {
    const comments = await this.commentsService.findByPost(payload._id);
    this.notificationsService.deleteCommentTagNotifications(
      comments.map(comment => comment._id),
    );
  }
}