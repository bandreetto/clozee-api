import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Order } from './contracts';
import { OrdersService } from './orders.service';

@Injectable({ scope: Scope.REQUEST })
export class OrdersLoader {
  constructor(private readonly ordersService: OrdersService) {}

  byUser = new DataLoader<string, Order[]>((userIds: string[]) =>
    this.ordersService
      .findManyByBuyers(userIds)
      .then(orders =>
        userIds.map(userId => orders.filter(order => order.buyer === userId)),
      ),
  );
}
