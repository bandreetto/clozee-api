import { JwtService } from '@nestjs/jwt';
import faker from 'faker';
import { createAccessToken } from '../../src/auth/auth.logic';
import configuration from '../../src/config/configuration';
import { User } from '../../src/users/contracts';
import { UsersService } from '../../src/users/users.service';

export interface GivenUsers {
  oneUserSignedUp: () => Promise<User>;
  someUsersSignedUp: (nOfUsers: number) => Promise<User[]>;
  someUsersLoggedIn: (nOfUsers: number) => Promise<[user: User, token: string][]>;
}

export function givenUsersFactory(usersService: UsersService, jwtService: JwtService): GivenUsers {
  async function oneUserSignedUp(): Promise<User> {
    const user: User = {
      _id: faker.datatype.uuid(),
      cpf: '464.917.188-16',
      name: faker.name.firstName(),
      email: faker.internet.email(),
      avatar: faker.image.imageUrl(),
      address: {
        city: faker.address.city(),
        state: faker.address.state(),
        number: faker.datatype.number(10000),
        street: faker.address.streetName(),
        zipCode: '09751-040',
        district: 'district',
      },
      username: faker.internet.userAgent(),
      phoneNumber: faker.phone.phoneNumber(),
    };
    const createdUser = await usersService.create(user);

    return createdUser;
  }

  async function someUsersSignedUp(nOfUsers: number): Promise<User[]> {
    const users: User[] = Array(nOfUsers)
      .fill(null)
      .map(() => ({
        _id: faker.datatype.uuid(),
        cpf: '464.917.188-16',
        name: faker.name.firstName(),
        email: faker.internet.email(),
        avatar: faker.image.imageUrl(),
        address: {
          city: faker.address.city(),
          state: faker.address.state(),
          number: faker.datatype.number(10000),
          street: faker.address.streetName(),
          zipCode: '09751-040',
          district: 'district',
        },
        username: faker.internet.userAgent(),
        phoneNumber: faker.phone.phoneNumber(),
      }));

    const createdUsers = await Promise.all(users.map(u => usersService.create(u)));

    return createdUsers;
  }

  async function someUsersLoggedIn(nOfUsers: number): Promise<[user: User, token: string][]> {
    const users = await someUsersSignedUp(nOfUsers);

    return users.map(u => [u, createAccessToken(u, configuration.auth.accessTokenExp(), jwtService)]);
  }

  return {
    oneUserSignedUp,
    someUsersSignedUp,
    someUsersLoggedIn,
  };
}
