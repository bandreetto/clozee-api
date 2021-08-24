import faker from 'faker';
import { User } from '../../src/users/contracts';

export const randomUser: User = {
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

export const clozeeTrendsUser: User = {
  ...randomUser,
  _id: 'clozee-trends-user',
};
