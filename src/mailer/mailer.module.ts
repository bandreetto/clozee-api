import { forwardRef, Module } from '@nestjs/common';
import { MailerConsumer } from './mailer.consumer';
import { MailerService } from './mailer.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [MailerService, MailerConsumer],
  exports: [MailerService],
})
export class MailerModule {}
