import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from '../common/reconciliators';
import { Sale } from './contracts';
import { OrdersService } from './orders.service';

@Injectable({ scope: Scope.REQUEST })
export class SalesLoader {
  constructor(private readonly ordersService: OrdersService) {}

  byOrder = new DataLoader<string, Sale[]>((orderIds: string[]) =>
    this.ordersService
      .findSalesByOrders(orderIds)
      .then(sales => orderIds.map(orderId => sales.filter(sale => sale.order === orderId))),
  );

  byPost = new DataLoader<string, Sale>((postIds: string[]) =>
    this.ordersService.findSalesByPosts(postIds).then(posts => reconciliateByKey('post', postIds, posts)),
  );
}
