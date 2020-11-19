import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from 'src/common/reconciliators';
import { Sale } from './contracts';
import { SalesService } from './sales.service';

@Injectable({ scope: Scope.REQUEST })
export class SalesLoader {
  constructor(private readonly salesService: SalesService) {}

  byOrder = new DataLoader<string, Sale[]>((orderIds: string[]) =>
    this.salesService
      .findByOrders(orderIds)
      .then(sales =>
        orderIds.map(orderId => sales.filter(sale => sale.order === orderId)),
      ),
  );

  byPost = new DataLoader<string, Sale>((postIds: string[]) =>
    this.salesService
      .findManyByPosts(postIds)
      .then(posts => reconciliateByKey('post', postIds, posts)),
  );
}
