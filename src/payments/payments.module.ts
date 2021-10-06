import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { PagarmeService } from './pagarme.service';
import { PagarmePostbacksController } from './pagarme-postbacks.controller';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [HttpModule, forwardRef(() => OrdersModule)],
  providers: [PagarmeService],
  exports: [PagarmeService],
  controllers: [PagarmePostbacksController],
})
export class PaymentsModule {}
