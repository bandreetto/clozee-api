import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Address,
  AddressSchema,
  Bank,
  BankSchema,
  BankInfo,
  BankInfoSchema,
  Coordinates,
  CoordinatesSchema,
  PaymentMethod,
  PaymentMethodSchema,
  SavedPost,
  SavedPostSchema,
  User,
  UserSchema,
} from './contracts';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PostsModule } from 'src/posts/posts.module';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersLoader } from './users.dataloaders';
import { BanksService } from './banks.service';
import { BanksResolver } from './banks.resolver';
import { BankInfoResolver } from './bank-info.resolver';

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
  ],
  providers: [
    UsersService,
    UsersResolver,
    UsersLoader,
    BanksResolver,
    BanksService,
    BankInfoResolver,
  ],
  exports: [UsersService, UsersLoader],
})
export class UsersModule {}
