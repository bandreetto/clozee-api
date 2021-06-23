import { Module, HttpModule } from '@nestjs/common';
import { CmsResolver } from './cms.resolver';
import { CmsService } from './cms.service';

@Module({
  imports: [HttpModule],
  providers: [CmsResolver, CmsService],
})
export class CmsModule {}
