import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryMenvCheckoutPayload } from '../delivery/contracts/payloads';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersConsumer {
  logger = new Logger(OrdersConsumer.name);

  constructor(private readonly ordersService: OrdersService) {}

  @OnEvent('delivery.menv.checkout', { async: true })
  async updateOrderDeliveryInfo(payload: DeliveryMenvCheckoutPayload) {
    try {
      await this.ordersService.update(payload.order._id, {
        deliveryInfo: {
          ...payload.order.deliveryInfo,
          menvDeliveryOrderId: payload.menvDeliveryOrderId,
          deliveryLabelUrl: payload.labelUrl,
        },
      });
    } catch (error) {
      this.logger.error({
        message:
          'Error while trying to update order delivery info from menv checkout.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
