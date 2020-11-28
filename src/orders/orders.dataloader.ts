import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { reconciliateByKey } from 'src/common/reconciliators';
import { Order } from './contracts';
import { OrdersService } from './orders.service';

@Injectable({ scope: Scope.REQUEST })
export class OrdersLoader extends DataLoader<string, Order> {
  constructor(private readonly ordersService: OrdersService) {
    super((ids: string[]) =>
      this.ordersService
        .findManyByIds(ids)
        .then(orders => reconciliateByKey('_id', ids, orders)),
    );
  }

  byUser = new DataLoader<string, Order[]>((userIds: string[]) =>
    this.ordersService
      .findManyByBuyers(userIds)
      .then(orders =>
        userIds.map(userId => orders.filter(order => order.buyer === userId)),
      ),
  );
}
