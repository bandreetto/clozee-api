import faker from 'faker';
import { User } from '../../src/users/contracts';
import { UsersService } from '../../src/users/users.service';

export interface GivenUsers {
  oneUserSignedUp: () => Promise<User>;
}

export function givenUsersFactory(usersService: UsersService): GivenUsers {
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

  return {
    oneUserSignedUp,
  };
}
