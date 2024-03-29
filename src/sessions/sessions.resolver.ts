import { Mutation, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../common/guards';
import { Session } from './contracts';
import { SessionsService } from './sessions.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser, TokenTypes } from '../common/decorators';
import { TokenUser } from '../common/types';
import { v4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TOKEN_TYPES } from '../auth/contracts/enums';

@Resolver()
export class SessionsResolver {
  constructor(private readonly sessionsService: SessionsService, private readonly eventEmitter: EventEmitter2) {}

  @UseGuards(AuthGuard)
  @TokenTypes(TOKEN_TYPES.ACCESS, TOKEN_TYPES.PRE_SIGN)
  @Mutation(() => Session)
  async startSession(@CurrentUser() user: TokenUser): Promise<Session> {
    const openSessions = await this.sessionsService.findByUser(user._id, true);
    await this.sessionsService.terminate(openSessions.map(s => s._id));
    openSessions.forEach(session => this.eventEmitter.emit('session.terminated', session));
    return this.sessionsService.create({
      _id: v4(),
      user: user._id,
    });
  }
}
