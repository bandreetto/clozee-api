import { ConflictException, Controller, Logger, Post, Req } from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import {
  OrderPostbackBody,
  OrderPostbackRequest,
  TransactionPostbackBody,
  TransactionPostbackRequest,
} from './contracts/dtos';
import { getUserFromPagarmeTransaction } from './pagarme.logic';
import { CountersService } from 'src/counters/counters.service';
import { Order, Sale } from 'src/orders/contracts';
import { v4 } from 'uuid';
import { getClozeeAmount } from 'src/orders/orders.logic';
import { FIXED_TAX, VARIABLE_TAX } from 'src/common/contants';
import { PostsService } from 'src/posts/posts.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MenvService } from 'src/delivery/menv.service';

@Controller('pagarme-postbacks')
export class PagarmePostbacksController {
  logger = new Logger(PagarmePostbacksController.name);
  orderAndTransactionsMap = new Map<string, OrderPostbackBody['order'] | TransactionPostbackBody['transaction']>();

  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly countersService: CountersService,
    private readonly postsService: PostsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly menvService: MenvService,
  ) {}

  @Post('orders')
  async ordersPostback(@Req() request: OrderPostbackRequest) {
    try {
      const [post] = request.body.order.items;
      this.logger.log(`Received pagarme postback for post ${post.id} in order ${request.body.order.id}`);
      if (request.body.order.status !== 'paid') {
        this.logger.error(
          `Order postback for post ${post.id} in order ${request.body.order.id} have status ${request.body.order.status}. Skipping sale creation.`,
        );
        this.orderAndTransactionsMap.delete(request.body.order.id);
        return;
      }
      const transaction = this.orderAndTransactionsMap.get(
        request.body.order.id,
      ) as TransactionPostbackBody['transaction'];
      if (!transaction) {
        // save order on orderAndTransactionsMap and wait for transaction postback
        this.orderAndTransactionsMap.set(request.body.order.id, request.body.order);
        return;
      }
      this.orderAndTransactionsMap.delete(request.body.order.id);
      await this.createOrderAndSales(request.body.order, transaction);
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
  async transactionsPostback(@Req() request: TransactionPostbackRequest) {
    try {
      this.logger.log(`Received pagarme postback for transaction ${request.body.transaction.id}`);
      if (request.body.transaction.status !== 'paid') {
        this.logger.error(
          `Transaction postback for transaction ${request.body.transaction.id} have status ${request.body.transaction.status}. Skipping sale creation.`,
        );
        this.orderAndTransactionsMap.delete(request.body.transaction.order_id);
        return;
      }
      const order = this.orderAndTransactionsMap.get(request.body.transaction.order_id) as OrderPostbackBody['order'];
      if (!order) {
        // save transaction on orderAndTransactionsMap and wait for order postback
        this.orderAndTransactionsMap.set(request.body.transaction.order_id, request.body.transaction);
        return;
      }
      this.orderAndTransactionsMap.delete(request.body.transaction.order_id);
      await this.createOrderAndSales(order, request.body.transaction);
    } catch (error) {
      this.logger.error({
        message: 'An error occoured on pagarme transaction postback.',
        error: error.toString(),
        metadata: {
          error,
          body: request.body,
        },
      });
      throw error;
    }
  }

  async createOrderAndSales(
    pagarmeOrder: OrderPostbackBody['order'],
    transaction: TransactionPostbackBody['transaction'],
  ) {
    const user = getUserFromPagarmeTransaction(transaction);
    const posts = await this.postsService.findManyByIds(pagarmeOrder.items.map(o => o.id));
    const buyer = await this.usersService.create(user);
    const postOwner = posts[0].user;
    const seller = await this.usersService.findById(typeof postOwner === 'string' ? postOwner : postOwner._id);
    const orderNumber = await this.countersService.getCounterAndIncrement('orders');
    const clozeeTax = getClozeeAmount(
      typeof seller.variableTaxOverride === 'number' ? seller.variableTaxOverride : VARIABLE_TAX,
      typeof seller.fixedTaxOverride === 'number' ? seller.fixedTaxOverride : FIXED_TAX,
      posts,
    );
    const deliveryInfo = await this.menvService.calculateDelivery(seller.address.zipCode, buyer.address.zipCode);
    const order: Order = {
      _id: v4(),
      number: orderNumber,
      buyer: buyer._id,
      clozeeTax,
      deliveryInfo: {
        price: deliveryInfo.price,
        deliveryTime: deliveryInfo.deliveryTime + 2,
        menvServiceNumber: deliveryInfo.id,
      },
      buyersAddress: buyer.address,
      sellersAddress: seller.address,
      pagarme: {
        pagarmeOrderId: pagarmeOrder.id,
        pagarmeTransactionId: transaction.id,
        paymentLinkId: pagarmeOrder.payment_link_id,
      },
    };
    const createdOrder = await this.ordersService.create(order);
    const sale: Sale = {
      _id: v4(),
      post: posts[0]._id,
      order: order._id,
    };
    try {
      await this.ordersService.createSales([sale]);
    } catch (error) {
      this.ordersService.update(createdOrder._id, { deleted: true });
      /**
       * Check for mongo duplicated error code
       */
      if (error.code === 11000) throw new ConflictException('Duplicated Sale error. This post is already sold.');
      throw error;
    }
    this.eventEmitter.emit('order.created', { order, posts });
  }
}
