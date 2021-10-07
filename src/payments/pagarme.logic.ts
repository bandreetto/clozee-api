import { User } from 'src/users/contracts';
import { v4 } from 'uuid';
import { TransactionPostbackBody } from './contracts/dtos';

export function getUserFromPagarmeTransaction(transaction: TransactionPostbackBody['transaction']): User {
  return {
    _id: v4(),
    cpf: transaction.customer.documents[0].number,
    name: transaction.customer.name,
    email: transaction.customer.email,
    address: {
      city: transaction.billing.address.city,
      state: transaction.billing.address.state,
      number: Number(transaction.billing.address.street_number),
      street: transaction.billing.address.street,
      zipCode: transaction.billing.address.zipcode,
      district: transaction.billing.address.neighborhood,
      complement: transaction.billing.address.complementary,
    },
    phoneNumber: transaction.customer.phone_numbers[0],
  };
}
