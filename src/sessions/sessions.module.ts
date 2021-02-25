import { Module } from '@nestjs/common';
import { SessionsResolver } from './sessions.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './contracts';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],

  providers: [SessionsResolver, SessionsService],
})
export class SessionsModule {}
