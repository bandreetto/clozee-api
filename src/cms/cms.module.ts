import { Module, HttpModule } from '@nestjs/common';
import { CmsService } from './cms.service';

@Module({
  imports: [HttpModule],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
