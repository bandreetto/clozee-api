import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersModule } from '../counters/counters.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { Order, OrderSchema, Sale, SaleSchema } from './contracts';
import { OrdersLoader } from './orders.dataloader';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { SalesLoader } from './sales.dataloader';
import { OrdersConsumer } from './orders.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sale.name,
        schema: SaleSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
    CountersModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => DeliveryModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PostsModule),
  ],
  providers: [SalesLoader, OrdersResolver, OrdersService, OrdersLoader, OrdersConsumer],
  exports: [SalesLoader, OrdersService, OrdersLoader],
})
export class OrdersModule {}
