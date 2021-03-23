import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import pagarme from 'pagarme';
import R from 'ramda';
import configuration from 'src/config/configuration';
import { User } from 'src/users/contracts';
import { ICreateCardResponse, ITransaction } from './contracts';
import { BankAccountCreateOptions } from './contracts/dtos';
import {
  formatCPF,
  formatDigit,
  formatPhoneNumber,
  formatZipCode,
  fromAccountTypeToPagarmeType,
} from './payments.logic';
@Injectable()
export class PagarmeService {
  logger = new Logger(PagarmeService.name);

  async transaction({
    clozeeAmount,
    sellerAmount,
    deliveryFee,
    seller,
    cardId,
    buyer,
    posts,
  }: ITransaction): Promise<string> {
    const totalAmount = clozeeAmount + sellerAmount;

    const client = await pagarme.client.connect({
      api_key: configuration.pagarme.token(),
    });

    const response = await client.transactions.create({
      capture: true,
      async: false,
      installments: '1',
      amount: totalAmount + deliveryFee,
      card_id: cardId,
      payment_method: 'credit_card',
      billing: {
        address: {
          city: buyer.address.city,
          complementary: buyer.address.complement,
          country: 'br',
          state: buyer.address.state,
          street: buyer.address.street,
          street_number: String(buyer.address.number),
          zipcode: formatZipCode(buyer.address.zipCode),
          neighborhood: buyer.address.district,
        },
        name: buyer.name,
      },
      customer: {
        external_id: buyer._id,
        name: buyer.name,
        phone_numbers: [formatPhoneNumber(buyer.phoneNumber)],
        type: 'individual',
        country: 'br',
        documents: [
          {
            type: 'cpf',
            number: formatCPF(buyer.cpf),
          },
        ],
        email: buyer.email,
      },
      items: posts.map(p => ({
        id: p._id,
        quantity: 1,
        tangible: true,
        title: p.title,
        unit_price: p.price,
        category: p.category.toString(),
      })),
      split_rules: [
        {
          recipient_id: seller.pagarmeRecipientId,
          amount: sellerAmount,
          liable: true,
          charge_processing_fee: false,
        },
        {
          recipient_id: configuration.pagarme.recipientId(),
          amount: clozeeAmount + deliveryFee,
          liable: true,
          charge_processing_fee: true,
          charge_remainder: true,
        },
      ],
    });

    if (response.status !== 'paid') {
      throw new InternalServerErrorException('Payment Denied');
    }

    return response.tid;
  }

  async createRecipient(user: User): Promise<string> {
    try {
      const client = await pagarme.client.connect({
        api_key: configuration.pagarme.token(),
      });

      const bankAccount: BankAccountCreateOptions = {
        agencia: user.bankInfo.agency,
        ...(user.bankInfo.agencyDv
          ? { agencia_dv: formatDigit(user.bankInfo.agencyDv) }
          : null),
        bank_code: String(user.bankInfo.bank),
        conta: user.bankInfo.account,
        ...(user.bankInfo.accountDv
          ? { conta_dv: formatDigit(user.bankInfo.accountDv) }
          : null),
        document_number: formatCPF(user.bankInfo.holderDocument),
        legal_name: user.bankInfo.holderName,
        type: fromAccountTypeToPagarmeType(user.bankInfo.accountType),
      };

      const response = await client.recipients.create({
        transfer_enabled: true,
        transfer_day: '0',
        transfer_interval: 'daily',
        metadata: {},
        bank_account: R.reject(R.anyPass([R.isEmpty, R.isNil, R.equals('')]))(
          bankAccount,
        ),
      });

      return response.id;
    } catch (error) {
      this.logger.error({
        message: `An error occoured while trying to create recipient on pagarme for the user ${user._id}`,
        error: error.toString(),
        metadata: error,
      });
      throw new InternalServerErrorException();
    }
  }

  async updateRecipient(
    bankInfo: User['bankInfo'],
    recipientId: string,
  ): Promise<string> {
    try {
      const client = await pagarme.client.connect({
        api_key: configuration.pagarme.token(),
      });
      const response = await client.recipients.update({
        id: recipientId,
        bank_account: {
          agencia: bankInfo.agency,
          ...(bankInfo.agencyDv
            ? { agencia_dv: formatDigit(bankInfo.agencyDv) }
            : null),
          bank_code: String(bankInfo.bank),
          conta: bankInfo.account,
          ...(bankInfo.accountDv
            ? { conta_dv: formatDigit(bankInfo.accountDv) }
            : null),
          document_number: formatCPF(bankInfo.holderDocument),
          legal_name: bankInfo.holderName,
          type: fromAccountTypeToPagarmeType(bankInfo.accountType),
        },
      });

      return response.id;
    } catch (error) {
      this.logger.error({
        message: `An error occoured while trying to update pagarme recipient for the user with recipiend id ${recipientId}`,
        error: error.toString(),
        metadata: error,
      });
      throw new InternalServerErrorException();
    }
  }

  async createCard(
    number: string,
    holderName: string,
    expirationDate: string,
    cvv: string,
  ): Promise<ICreateCardResponse> {
    try {
      const client = await pagarme.client.connect({
        api_key: configuration.pagarme.token(),
      });
      const response = await client.cards.create(
        {
          card_number: number,
          card_holder_name: holderName,
          card_expiration_date: expirationDate,
          card_cvv: cvv,
        },
        {},
      );
      return response as ICreateCardResponse;
    } catch (error) {
      this.logger.error({
        message:
          'An error occoured while trying to create pagarme credit card.',
        error: error.toString(),
        metadata: error,
      });
      throw new InternalServerErrorException();
    }
  }
}
