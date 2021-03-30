import { registerEnumType } from '@nestjs/graphql';
import { CommentTagNotification } from './comment-tag-notification';
import { PostCommentNotification } from './post-comment-notification';
import { SaleNotification } from './sale-notification';

export enum NOTIFICAION_KINDS {
  COMMENT_TAG = 'COMMENT_TAG',
  SALE = 'SALE',
  POST_COMMENT = 'POST_COMMENT',
}

registerEnumType(NOTIFICAION_KINDS, {
  name: 'NOTIFICAION_KINDS',
  description: 'The kinds of notification existing in the app.',
});

export const NOTIFICATION_ENUM_TO_KIND_MAPPER = {
  [NOTIFICAION_KINDS.COMMENT_TAG]: CommentTagNotification.name,
  [NOTIFICAION_KINDS.POST_COMMENT]: PostCommentNotification.name,
  [NOTIFICAION_KINDS.SALE]: SaleNotification.name,
};
