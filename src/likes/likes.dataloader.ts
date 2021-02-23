import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { LikesService } from './likes.service';
import { reconciliateByKey } from 'src/common/reconciliators';
import { Like } from './contracts';

@Injectable({ scope: Scope.REQUEST })
export class LikesLoader extends DataLoader<string, Like> {
  constructor(private readonly likesService: LikesService) {
    super((ids: string[]) =>
      this.likesService
        .findManyByIds(ids)
        .then(likes => reconciliateByKey('_id', ids, likes)),
    );
  }

  countByPost = new DataLoader<string, number>((postIds: string[]) =>
    this.likesService
      .countByPosts(postIds)
      .then(postCounts =>
        reconciliateByKey('_id', postIds, postCounts).map(p => p?.count || 0),
      ),
  );
}
