import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { TrendsResolver } from './trends.resolver';

@Module({
  imports: [UsersModule],
  providers: [TrendsResolver],
})
export class TrendsModule {}
