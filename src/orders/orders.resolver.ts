import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Args,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Root,
} from '@nestjs/graphql';
import { uniq } from 'ramda';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { CountersService } from 'src/counters/counters.service';
import { DeliveryService } from 'src/delivery/delivery.service';
import { Post } from 'src/posts/contracts';
import { PostsLoader } from 'src/posts/posts.dataloader';
import { PostsService } from 'src/posts/posts.service';
import { User } from 'src/users/contracts';
import { UsersLoader } from 'src/users/users.dataloaders';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { Order, Sale } from './contracts';
import { CheckoutInput } from './contracts/inputs';
import { OrdersService } from './orders.service';
import { SalesLoader } from './sales.dataloader';
import { PagarmeService } from 'src/payments/pagarme.service';

@Resolver(() => Order)
export class OrdersResolver {
  logger = new Logger(OrdersResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersLoader: UsersLoader,
    private readonly salesLoader: SalesLoader,
    private readonly ordersService: OrdersService,
    private readonly countersService: CountersService,
    private readonly postsService: PostsService,
    private readonly postsLoader: PostsLoader,
    private readonly deliveryService: DeliveryService,
    private readonly pagarmeService: PagarmeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => Order)
  order(@Args('orderId') orderId: string): Promise<Order> {
    return this.ordersService.findById(orderId);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Order], {
    description: 'The orders that the current user has bought.',
  })
  myOrders(@CurrentUser() user: TokenUser) {
    return this.ordersService.findByBuyer(user._id);
  }

  @UseGuards(AuthGuard)
  @Query(() => [Order], {
    description: 'Orders that the current user has sold.',
  })
  async mySales(@CurrentUser() user: TokenUser) {
    const userPosts = await this.postsService.findManyByUser(user._id);
    const userSales = await this.ordersService.findSalesByPosts(
      userPosts.map(post => post._id),
    );
    const orderIds = userSales.map(sale => sale.order) as string[];
    return this.ordersService.findManyByIds(uniq(orderIds));
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  async checkout(
    @Args('input') input: CheckoutInput,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Order> {
    const [user, paymentMethods, posts] = await Promise.all([
      this.usersService.findById(tokenUser._id),
      this.usersService.getUserPaymentMethods(tokenUser._id),
      this.postsService.findManyByIds(input.posts),
    ]);
    if (!user) throw new UnauthorizedException(); // Just a sanity check
    if (!user.address)
      throw new BadRequestException(
        'User must have an address to be able to buy.',
      );

    const paymentMethod = paymentMethods.find(
      p => p._id === input.paymentMethodId,
    );
    if (!paymentMethod)
      throw new BadRequestException('Could not find this payment method.');

    if (posts.some(post => post.user !== posts[0].user))
      throw new BadRequestException(
        'You can only buy posts from the same seller in a checkout.',
      );

    const seller = await this.usersService.findById(posts[0].user as string);
    const delivery = await this.deliveryService.findById(input.deliveryInfoId);
    if (!delivery)
      throw new BadRequestException({
        message:
          'No delivery info found for this buyer and seller. Create a delivery info by using the mutation "deliveryInfo" before attempting to checkout.',
        buyer: user._id,
        seller: posts[0].user,
      });
    if (
      delivery.buyersZipCode !== user.address.zipCode ||
      delivery.sellersZipCode !== seller.address.zipCode
    )
      throw new BadRequestException(
        'Delivery info found for this is stale (zip code mismatch). Update the delivery info by using the mutation "deliveryInfo" before attempting to checkout.',
      );

    let order: Order;
    const session = await this.ordersService.startTransaction();
    try {
      const orderNumber = await this.countersService.getCounterAndIncrement(
        'orders',
      );

      const orderId = v4();
      const newSales: Sale[] = input.posts.map(post => ({
        _id: v4(),
        post,
        order: orderId,
      }));

      await this.ordersService.createSales(newSales, session);
      order = await this.ordersService.create(
        {
          _id: orderId,
          number: orderNumber,
          buyer: user._id,
          paymentMethod: paymentMethod._id,
          buyersAddress: user.address,
          sellersAddress: seller.address,
          deliveryInfo: {
            price: delivery.price,
            deliveryTime: delivery.deliveryTime,
            menvServiceNumber: delivery.menvServiceNumber,
          },
        },
        session,
      );

      await this.pagarmeService.transaction({
        amount: posts.reduce((total, post) => post.price + total, 0),
        deliveryFee: order.deliveryInfo.price,
        buyer: user,
        cardId: paymentMethod.cardId,
        posts,
        seller,
      });

      await this.ordersService.commitTransaction(session);
    } catch (error) {
      this.ordersService.abortTransaction(session);
      this.logger.error({
        message: 'An error occoured while trying to create order and sales.',
        error: error.toString(),
        metadata: {
          error,
          input,
          buyer: tokenUser,
        },
      });

      /**
       * Check for mongo duplicated error code
       */
      if (error.code === 11000)
        throw new ConflictException(
          'Duplicated Sale error. This post is already sold.',
        );

      if (error.message === 'Payment Denied') throw error;
      throw new InternalServerErrorException(
        'An error occoured while trying to create order and sales.',
      );
    }
    this.eventEmitter.emit('order.created', { order, posts });
    return order;
  }

  @ResolveField()
  async buyer(@Root() order: Order): Promise<User> {
    if (typeof order.buyer !== 'string') return order.buyer;
    return this.usersLoader.load(order.buyer);
  }

  @ResolveField()
  async posts(@Root() order: Order): Promise<Post[]> {
    const sales = await this.salesLoader.byOrder.load(order._id);
    return this.postsLoader.loadMany(
      sales.map(s => s.post as string),
    ) as Promise<Post[]>;
  }

  @ResolveField()
  async total(@Root() order: Order): Promise<number> {
    const sales = await this.salesLoader.byOrder.load(order._id);
    const posts = (await this.postsLoader.loadMany(
      sales.map(s => s.post as string),
    )) as Post[];
    const postsTotal = posts.reduce((total, post) => total + post.price, 0);
    return postsTotal + order.deliveryInfo.price;
  }

  @ResolveField()
  async itemsPrice(@Root() order: Order): Promise<number> {
    const sales = await this.salesLoader.byOrder.load(order._id);
    const posts = (await this.postsLoader.loadMany(
      sales.map(s => s.post as string),
    )) as Post[];
    return posts.reduce((total, post) => total + post.price, 0);
  }
}
