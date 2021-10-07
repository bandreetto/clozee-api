import faker from 'faker';
import { Address, User } from 'src/users/contracts';
import { getUserFromPagarmeTransaction } from './pagarme.logic';
import { randomTransaction } from '../../test/mocks/payments.dtos';
import { v4 } from 'uuid';

const userName = faker.name.findName();
const userEmail = faker.internet.email();
const address: Address = {
  city: faker.address.city(),
  state: faker.address.state(),
  number: faker.datatype.number(),
  street: faker.address.streetName(),
  zipCode: faker.address.zipCode(),
  district: faker.address.county(),
  complement: faker.lorem.word(),
};
const phoneNumber = faker.phone.phoneNumber();

describe('Pagarme Logic', () => {
  it('Should correctly get user from transaction', () => {
    const expectedUser: Omit<User, '_id'> = {
      cpf: '16041723045',
      name: userName,
      email: userEmail,
      address,
      phoneNumber,
    };
    const pagarmeTransaction = randomTransaction(userEmail, userName, phoneNumber, address, v4());
    const extractedUser = getUserFromPagarmeTransaction(pagarmeTransaction);
    delete extractedUser._id;
    expect(extractedUser).toEqual(expectedUser);
  });
});
