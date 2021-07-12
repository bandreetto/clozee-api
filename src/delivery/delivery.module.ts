import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mailer/mailer.module';
import { Delivery, DeliverySchema } from './contracts';
import { DeliveryConsumer } from './delivery.consumer';
import { DeliveryResolver } from './delivery.resolver';
import { DeliveryService } from './delivery.service';
import { MenvService } from './menv.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Delivery.name,
        schema: DeliverySchema,
      },
    ]),
    HttpModule,
    MailerModule,
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
  ],
  providers: [DeliveryResolver, DeliveryService, MenvService, DeliveryConsumer],
  exports: [DeliveryService, MenvService],
})
export class DeliveryModule {}
