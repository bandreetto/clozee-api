import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { Delivery, DeliverySchema } from './contracts';
import { CorreiosService } from './correios.service';
import { DeliveryResolver } from './delivery.resolver';
import { DeliveryService } from './delivery.service';
import { MenvController } from './menv.controller';
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
    forwardRef(() => UsersModule),
    forwardRef(() => OrdersModule),
  ],
  providers: [
    DeliveryResolver,
    CorreiosService,
    DeliveryService,
    MenvService,
    MenvController,
  ],
  exports: [DeliveryService, MenvController, MenvService],
})
export class DeliveryModule {}
