import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { PagarmeService } from './pagarme.service';
import { PagarmePostbacksController } from './pagarme-postbacks.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { CountersModule } from 'src/counters/counters.module';
import { PostsModule } from 'src/posts/posts.module';
import { DeliveryModule } from 'src/delivery/delivery.module';

@Module({
  imports: [
    HttpModule,
    CountersModule,
    DeliveryModule,
    PostsModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
  ],
  providers: [PagarmeService],
  exports: [PagarmeService],
  controllers: [PagarmePostbacksController],
})
export class PaymentsModule {}
