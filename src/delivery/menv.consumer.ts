import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Order } from 'src/orders/contracts';
import { Post } from 'src/posts/contracts';
import { UsersService } from '../users/users.service';
import { reconciliateByKey } from '../common/reconciliators';
import { OrdersService } from '../orders/orders.service';
import { MenvService } from './menv.service';

@Injectable()
export class MenvConsumer {
  logger = new Logger(MenvConsumer.name);

  constructor(
    private readonly menvService: MenvService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  @OnEvent('order.created', {
    async: true,
  })
  async addItemsToMenvCart(payload: { order: Order; posts: Post[] }) {
    try {
      const [sellerId, buyerId] = [
        payload.posts[0].user as string,
        payload.order.buyer as string,
      ];
      const [seller, buyer] = await this.usersService
        .findManyByIds([sellerId, buyerId])
        .then(users => reconciliateByKey('_id', [sellerId, buyerId], users));
      const { orderId: menvDeliveryOrderId } = await this.menvService.addToCart(
        payload.order.deliveryInfo.menvServiceNumber,
        seller,
        buyer,
        payload.posts,
        payload.order.number,
      );
      await this.ordersService.update(payload.order._id, {
        deliveryInfo: {
          ...payload.order.deliveryInfo,
          menvDeliveryOrderId,
        },
      });
    } catch (error) {
      this.logger.error({
        message: 'An error occoured while trying to add items to menv cart',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
