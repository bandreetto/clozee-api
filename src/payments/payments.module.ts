import { HttpModule, Module } from '@nestjs/common';
import { PagarmeService } from './pagarme.service';

@Module({
  imports: [HttpModule],
  providers: [PagarmeService],
  exports: [PagarmeService],
})
export class PaymentsModule {}
