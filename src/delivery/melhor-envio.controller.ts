import { Injectable, Logger } from '@nestjs/common';
import { MenvService } from 'src/delivery/melhor-envio.service';

@Injectable()
export class MenvController {
  logger = new Logger(MenvController.name);

  constructor(private readonly menvService: MenvService) {}

  async getLabelURLForOrder(menvOrderId: string) {
    try {
      await this.menvService.checkout([menvOrderId]);
      await this.menvService.generateLabels([menvOrderId]);
      const { url } = await this.menvService.printLabels([menvOrderId]);

      return url;
    } catch (error) {
      this.logger.error({
        message: 'Error while getting delivery label',
        error,
        menvOrderId,
      });
      throw new Error('Unable to generate delivery label');
    }
  }
}
