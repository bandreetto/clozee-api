import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersModule } from 'src/counters/counters.module';
import { DeliveryModule } from 'src/delivery/delivery.module';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { Order, OrderSchema, Sale, SaleSchema } from './contracts';
import { OrdersLoader } from './orders.dataloader';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { SalesLoader } from './sales.dataloader';

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
    DeliveryModule,
    forwardRef(() => UsersModule),
    forwardRef(() => PostsModule),
  ],
  providers: [SalesLoader, OrdersResolver, OrdersService, OrdersLoader],
  exports: [SalesLoader, OrdersService, OrdersLoader],
})
export class OrdersModule {}
