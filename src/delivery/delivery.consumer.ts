import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';
import { reconciliateByKey } from '../common/reconciliators';
import { MenvService } from './menv.service';
import { OrderCreatedPayload } from 'src/orders/contracts/payloads';

@Injectable()
export class DeliveryConsumer {
  logger = new Logger(DeliveryConsumer.name);

  constructor(
    private readonly menvService: MenvService,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('order.created', {
    async: true,
  })
  async checkoutMenvDeliveryOrder(payload: OrderCreatedPayload) {
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
      await this.menvService.checkout([menvDeliveryOrderId]);
      await this.menvService.generateLabels([menvDeliveryOrderId]);
      const { url } = await this.menvService.printLabels([menvDeliveryOrderId]);
      this.eventEmitter.emit('delivery.menv.checkout', {
        menvDeliveryOrderId,
        labelUrl: url,
        order: payload.order,
        posts: payload.posts,
      });
    } catch (error) {
      this.logger.error({
        message:
          'An error occoured while trying to checkout menv delviery order.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
