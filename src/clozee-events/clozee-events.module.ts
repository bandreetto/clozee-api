import { Module } from '@nestjs/common';
import { ClozeeEventsResolver } from './clozee-events.resolver';

@Module({
  providers: [ClozeeEventsResolver]
})
export class ClozeeEventsModule {}
