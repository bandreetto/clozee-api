import { registerEnumType } from '@nestjs/graphql';
import { CommentTagNotification } from './comment-tag-notification';
import { GroupInviteNotification } from './group-invite-notification';
import { GroupPostNotification } from './group-post-notification';
import { PostCommentNotification } from './post-comment-notification';
import { SaleNotification } from './sale-notification';

export enum NOTIFICATION_KINDS {
  COMMENT_TAG = 'COMMENT_TAG',
  SALE = 'SALE',
  POST_COMMENT = 'POST_COMMENT',
  GROUP_INVITE = 'GROUP_INVITE',
  GROUP_POST = 'GROUP_POST',
}

registerEnumType(NOTIFICATION_KINDS, {
  name: 'NOTIFICAION_KINDS',
  description: 'The kinds of notification existing in the app.',
});

export const NOTIFICATION_ENUM_TO_KIND_MAPPER = {
  [NOTIFICATION_KINDS.COMMENT_TAG]: CommentTagNotification.name,
  [NOTIFICATION_KINDS.POST_COMMENT]: PostCommentNotification.name,
  [NOTIFICATION_KINDS.SALE]: SaleNotification.name,
  [NOTIFICATION_KINDS.GROUP_INVITE]: GroupInviteNotification.name,
  [NOTIFICATION_KINDS.GROUP_POST]: GroupPostNotification.name,
};
