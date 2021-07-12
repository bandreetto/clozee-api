import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsModule } from '../follows/follows.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { PostsModule } from '../posts/posts.module';
import { BankInfoResolver } from './bank-info.resolver';
import { BanksResolver } from './banks.resolver';
import { BanksService } from './banks.service';
import {
  Address,
  AddressSchema,
  Bank,
  BankInfo,
  BankInfoSchema,
  BankSchema,
  Coordinates,
  CoordinatesSchema,
  PaymentMethod,
  PaymentMethodSchema,
  SavedPost,
  SavedPostSchema,
  User,
  UserSchema,
} from './contracts';
import { UsersLoader } from './users.dataloaders';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Coordinates.name,
        schema: CoordinatesSchema,
      },
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: SavedPost.name,
        schema: SavedPostSchema,
      },
      {
        name: PaymentMethod.name,
        schema: PaymentMethodSchema,
      },
      {
        name: Bank.name,
        schema: BankSchema,
      },
      {
        name: BankInfo.name,
        schema: BankInfoSchema,
      },
    ]),
    forwardRef(() => PostsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => FollowsModule),
    PaymentsModule,
  ],
  providers: [UsersService, UsersResolver, UsersLoader, BanksResolver, BanksService, BankInfoResolver],
  exports: [UsersService, UsersLoader],
})
export class UsersModule {}
