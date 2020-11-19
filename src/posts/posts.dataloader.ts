import { Injectable, Scope } from '@nestjs/common';
import { Post } from './contracts';
import DataLoader from 'dataloader';
import { PostsService } from './posts.service';
import { reconciliateByKey } from 'src/common/reconciliators';

@Injectable({ scope: Scope.REQUEST })
export class PostsLoader extends DataLoader<string, Post> {
  constructor(private readonly postsService: PostsService) {
    super((ids: string[]) =>
      this.postsService
        .findManyByIds(ids)
        .then(posts => reconciliateByKey('_id', ids, posts)),
    );
  }

  byUser = new DataLoader<string, Post[]>((userIds: string[]) =>
    this.postsService
      .findManyByUsers(userIds)
      .then(posts =>
        userIds.map(userId => posts.filter(post => post.user === userId)),
      ),
  );
}
