import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/decorators';
import { AuthGuard } from 'src/common/guards';
import { TokenUser } from 'src/common/types';
import { UsersLoader } from 'src/users/users.dataloaders';
import { Delivery } from './contracts';
import { CorreiosService } from './correios.service';
import { DeliveryService } from './delivery.service';

@Resolver()
export class DeliveryResolver {
  constructor(
    private readonly usersLoader: UsersLoader,
    private readonly correiosService: CorreiosService,
    private readonly deliveryService: DeliveryService,
  ) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Delivery, {
    description:
      'Creates or updates the delivery info from the provided seller to the requesting user. This info may be used by the checkout.',
  })
  async updateDeliveryInfo(
    @Args('seller') sellerId: string,
    @CurrentUser() tokenUser: TokenUser,
  ): Promise<Delivery> {
    if (sellerId === tokenUser._id)
      throw new BadRequestException({
        message: 'Seller cannot be the current user.',
      });

    const [seller, buyer] = await Promise.all([
      this.usersLoader.load(sellerId),
      this.usersLoader.load(tokenUser._id),
    ]);
    if (!seller)
      throw new NotFoundException('Could not find a seller with this id.');

    if (!seller.address?.zipCode)
      throw new UnprocessableEntityException({
        message: 'Seller must have an address with zipCode.',
        sellerId,
      });
    if (!buyer.address?.zipCode)
      throw new UnprocessableEntityException({
        message: 'Requesting user must have an address with zipCode.',
        userId: tokenUser._id,
      });
    const {
      price,
      deliveryTime,
    } = await this.correiosService.getDeliveryPriceAndTime(
      seller.address.zipCode,
      buyer.address.zipCode,
    );

    return this.deliveryService.upsert({
      _id: `${buyer._id}:${seller._id}`,
      buyersZipCode: buyer.address.zipCode,
      sellersZipCode: seller.address.zipCode,
      price,
      deliveryTime,
    });
  }
}
