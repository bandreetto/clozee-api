import { Module } from '@nestjs/common';
import { PagarmeService } from './pagarme.service';

@Module({
  imports: [],
  exports: [PagarmeService],
})
export class PaymentsModule {}
