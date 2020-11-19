import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from 'src/common/reconciliators';
import { CommentsService } from './comments.service';
import { Comment } from './contracts';

@Injectable({ scope: Scope.REQUEST })
export class CommentsLoader extends DataLoader<string, Comment> {
  constructor(private readonly commentsService: CommentsService) {
    super((ids: string[]) =>
      this.commentsService
        .findManyByIds(ids)
        .then(comments => reconciliateByKey('_id', ids, comments)),
    );
  }

  byPost = new DataLoader<string, Comment[]>((postIds: string[]) =>
    this.commentsService
      .findByPosts(postIds)
      .then(comments =>
        postIds.map(postId =>
          comments.filter(comment => comment.post === postId),
        ),
      ),
  );
}
