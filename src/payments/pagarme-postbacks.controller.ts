import { Controller, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SALE_STATUS } from 'src/orders/contracts/enums';
import { OrdersService } from 'src/orders/orders.service';
import { OrderPostbackRequest } from './contracts/dtos';

@Controller('pagarme-postbacks')
export class PagarmePostbacksController {
  constructor(private readonly ordersService: OrdersService) {}
  logger = new Logger(PagarmePostbacksController.name);

  @Post('orders')
  async ordersPostback(@Req() request: OrderPostbackRequest) {
    try {
      const [post] = request.body.order.items;
      this.logger.log(`Marking post ${post.id} sale as paid`);
      await this.ordersService.updateSaleByPost(post.id, {
        status: SALE_STATUS.paid,
      });
    } catch (error) {
      this.logger.error({
        message: 'An error occoured on pagarme order postback.',
        error: error.toString(),
        metadata: {
          error,
          body: request.body,
        },
      });
      throw error;
    }
  }

  @Post('transactions')
  transactionsPostback(@Req() request: Request) {
    try {
      console.log({
        body: request.body,
        customer: request.body.transaction.customer,
        billing: request.body.transaction.billing,
      });
    } catch (error) {
      this.logger.error({
        message: 'An error occoured on pagarme transaction postback.',
        error: error.toString(),
        metadata: {
          error,
          body: request.body,
        },
      });
    }
  }
}
