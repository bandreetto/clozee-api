import faker from 'faker';
import { User } from '../../src/users/contracts';

<<<<<<< HEAD
export function randomUser(): User {
  return {
    _id: faker.datatype.uuid(),
    cpf: '999.999.999-99',
    name: faker.name.firstName(),
    email: faker.internet.email(),
    avatar: faker.image.imageUrl(),
    address: {
      city: faker.address.city(),
      state: faker.address.state(),
      number: faker.datatype.number(10000),
      street: faker.address.streetName(),
      zipCode: '99999-999',
      district: 'district',
    },
    username: faker.internet.userAgent(),
    phoneNumber: faker.phone.phoneNumber(),
  };
}

export function clozeeTrendsUser(): User {
  return {
    ...randomUser(),
    _id: 'clozee-trends-user',
  };
}
