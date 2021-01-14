import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { LikesService } from './likes.service';
import { reconciliateByKey } from 'src/common/reconciliators';

@Injectable({ scope: Scope.REQUEST })
export class LikesLoader {
  constructor(private readonly likesService: LikesService) {}

  countByPost = new DataLoader<string, number>((postIds: string[]) =>
    this.likesService
      .countByPost(postIds)
      .then(postCounts =>
        reconciliateByKey('_id', postIds, postCounts).map(p => p?.count || 0),
      ),
  );
}
