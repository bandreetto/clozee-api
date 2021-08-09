import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from '../common/reconciliators';
import { Group } from './contracts';
import { GroupsService } from './groups.service';

@Injectable({ scope: Scope.REQUEST })
export class GroupsLoader extends DataLoader<string, Group> {
  constructor(private readonly groupsService: GroupsService) {
    super((ids: string[]) =>
      this.groupsService.findManyByIds(ids).then(groups => reconciliateByKey('_id', ids, groups)),
    );
  }
}
