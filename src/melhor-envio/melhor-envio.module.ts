import { HttpModule, Module } from '@nestjs/common';
import { MenvService } from './melhor-envio.service';

@Module({
  imports: [HttpModule],
  exports: [MenvService],
})
export class MelhorEnvioModule {}
