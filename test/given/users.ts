import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { createAccessToken } from '../../src/auth/auth.logic';
import configuration from '../../src/config/configuration';
import { SessionsService } from '../../src/sessions/sessions.service';
import { User } from '../../src/users/contracts';
import { UsersService } from '../../src/users/users.service';

export interface GivenUsers {
  oneUserSignedUp: (user: User) => Promise<User>;
  someUsersSignedUp: (users: User[]) => Promise<User[]>;
  someUsersLoggedIn: (users: User[]) => Promise<[user: User, token: string][]>;
  someUsersWithSessionStarted: (users: User[]) => Promise<[user: User, token: string][]>;
}

export function givenUsersFactory(
  usersService: UsersService,
  jwtService: JwtService,
  sessionsService: SessionsService,
  eventEmitter: EventEmitter2,
): GivenUsers {
  async function oneUserSignedUp(user: User): Promise<User> {
    const createdUser = await usersService.create(user);
    await eventEmitter.emitAsync('user.preSigned', createdUser._id);

    return createdUser;
  }

  async function someUsersSignedUp(users: User[]): Promise<User[]> {
    const createdUsers = await Promise.all(users.map(u => usersService.create(u)));
    await Promise.all(createdUsers.map(user => eventEmitter.emitAsync('user.preSigned', user._id)));

    return createdUsers;
  }

  async function someUsersLoggedIn(users: User[]): Promise<[user: User, token: string][]> {
    const signedUpUsers = await someUsersSignedUp(users);

    return signedUpUsers.map(u => [u, createAccessToken(u, configuration.auth.accessTokenExp(), jwtService)]);
  }

  async function someUsersWithSessionStarted(users: User[]): Promise<[user: User, token: string][]> {
    const loggedUsers = await someUsersLoggedIn(users);

    await Promise.all(
      loggedUsers.map(([user]) =>
        sessionsService.create({
          _id: v4(),
          user: user._id,
        }),
      ),
    );

    return loggedUsers;
  }

  return {
    oneUserSignedUp,
    someUsersSignedUp,
    someUsersLoggedIn,
    someUsersWithSessionStarted,
  };
}
