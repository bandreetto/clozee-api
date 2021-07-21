import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { Order } from '../orders/contracts';
import { OrdersLoader } from '../orders/orders.dataloader';
import { SaleNotification } from './contracts';

@Resolver(() => SaleNotification)
export class SaleNotificationResolver {
  constructor(private readonly ordersLoader: OrdersLoader) {}

  @ResolveField()
  async order(@Root() notification: SaleNotification): Promise<Order> {
    if (typeof notification.order !== 'string') return notification.order;
    return this.ordersLoader.load(notification.order);
  }
}
