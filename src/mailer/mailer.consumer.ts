import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryMenvCheckoutPayload } from '../delivery/contracts/payloads';
import { OrderCreatedPayload } from '../orders/contracts/payloads';
import { UsersService } from '../users/users.service';
import { MailerService } from './mailer.service';
import { getSplitValues, getSubTotal } from '../orders/orders.logic';

@Injectable()
export class MailerConsumer {
  logger = new Logger(MailerConsumer.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly usersService: UsersService,
  ) {}

  @OnEvent('order.created', { async: true })
  async sendBuyerEmail(payload: OrderCreatedPayload) {
    try {
      const buyer = await this.usersService.findById(
        payload.order.buyer as string,
      );

      const subTotal = getSubTotal(payload.posts);

      await this.mailerService.sendBuyerEmail(
        buyer,
        payload.order,
        payload.posts,
        subTotal,
        subTotal + payload.order.deliveryInfo.price,
      );
    } catch (error) {
      this.logger.error({
        message: "Error while trying to send buyer's email.",
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }

  @OnEvent('delivery.menv.checkout', { async: true })
  async sendSellerEmail(payload: DeliveryMenvCheckoutPayload) {
    try {
      const sellerId = payload.posts[0].user as string;
      const buyerId = payload.order.buyer as string;
      const [seller, buyer] = await Promise.all([
        this.usersService.findById(sellerId),
        this.usersService.findById(buyerId),
      ]);
      const subTotal = getSubTotal(payload.posts);
      const [sellerTaxes] = getSplitValues(payload.posts);
      await this.mailerService.sendSellerMail(
        buyer,
        seller,
        payload.order,
        payload.posts,
        subTotal,
        sellerTaxes,
        subTotal - sellerTaxes,
        payload.labelUrl,
      );
    } catch (error) {
      this.logger.error({
        message: 'Error while trying to send seller email after menv checkout.',
        payload,
        error: error.toString(),
        metadata: error,
      });
    }
  }
}
