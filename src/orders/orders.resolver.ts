import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Mutation, ResolveField, Resolver, Root } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { CountersService } from 'src/counters/counters.service';
import { User } from 'src/users/contracts';
import { UsersService } from 'src/users/users.service';
import { v4 } from 'uuid';
import { Order, Sale } from './contracts';
import { CheckoutInput } from './contracts/inputs';
import { OrdersService } from './orders.service';
import { SalesService } from './sales.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly salesService: SalesService,
    private readonly ordersService: OrdersService,
    private readonly countersService: CountersService,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  async checkout(
    @Args('input') input: CheckoutInput,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Order> {
    const [user, paymentMethods] = await Promise.all([
      this.usersService.findById(tokenUser._id),
      this.usersService.getUserPaymentMethods(tokenUser._id),
    ]);
    if (!user) throw new UnauthorizedException(); // Just a sanity check
    if (!user.address)
      throw new HttpException(
        'User must have an address to be able to buy.',
        HttpStatus.BAD_REQUEST,
      );

    const paymentMethod = paymentMethods.find(
      p => p._id === input.paymentMethodId,
    );
    if (!paymentMethod)
      throw new HttpException(
        'Could not find this payment method.',
        HttpStatus.BAD_REQUEST,
      );

    const orderId = v4();
    const newSales: Sale[] = input.posts.map(post => ({
      _id: v4(),
      post,
      order: orderId,
    }));
    await this.salesService.createMany(newSales);
    return this.ordersService.create({
      _id: orderId,
      number: await this.countersService.getCounterAndIncrement('orders'),
      buyer: user._id,
      paymentMethod: paymentMethod._id,
      address: user.address,
    });
  }

  @ResolveField()
  async buyer(@Root() order: Order): Promise<User> {
    if (typeof order.buyer !== 'string') return order.buyer;
    return this.usersService.findById(order.buyer);
  }
}
