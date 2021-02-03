import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { Delivery, DeliverySchema } from './contracts';
import { CorreiosService } from './correios.service';
import { DeliveryResolver } from './delivery.resolver';
import { DeliveryService } from './delivery.service';

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
  ],
  providers: [DeliveryResolver, CorreiosService, DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}