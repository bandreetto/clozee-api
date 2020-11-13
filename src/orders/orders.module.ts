import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountersModule } from 'src/counters/counters.module';
import { PostsModule } from 'src/posts/posts.module';
import { UsersModule } from 'src/users/users.module';
import { Order, OrderSchema, Sale, SaleSchema } from './contracts';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { SalesService } from './sales.service';

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
    UsersModule,
    PostsModule,
    CountersModule,
  ],
  providers: [SalesService, OrdersResolver, OrdersService],
})
export class OrdersModule {}
