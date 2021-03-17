import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedPayload } from '../orders/contracts/payloads';
import { MailerService } from './mailer.service';
import { UsersService } from '../users/users.service';
import { DeliveryMenvCheckoutPayload } from '../delivery/contracts/payloads';
import { TAX_PERCENTAGE } from 'src/common/contants';

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

      const subTotal = payload.posts.reduce((acc, post) => acc + post.price, 0);

      await this.mailerService.sendBuyerEmail(
        buyer,
        payload.order,
        payload.posts,
        subTotal,
        0,
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
      const sellesId = payload.posts[0].user as string;
      const seller = await this.usersService.findById(sellesId);
      const subTotal = payload.posts.reduce((acc, post) => acc + post.price, 0);
      const sellerTaxes = subTotal * TAX_PERCENTAGE;
      await this.mailerService.sendSellerMail(
        seller,
        payload.order,
        payload.posts,
        subTotal,
        sellerTaxes,
        subTotal + payload.order.deliveryInfo.price,
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
