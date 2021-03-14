import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import pagarme from 'pagarme';
import { BankAccountCreateOptions } from 'pagarme-js-types/src/client/bankAccounts/options';
import R from 'ramda';
import { TAX_PERCENTAGE } from 'src/common/contants';
import configuration from 'src/config/configuration';
import { User } from 'src/users/contracts';
import { FIXED_TAX, MINIMUM_TRANSACTION_VALUE } from './../common/contants';
import { ICreateCardResponse, ITransaction } from './contracts';
import {
  formatCPF,
  formatPhoneNumber,
  formatZipCode,
  fromAccountTypeToPagarmeType,
} from './payments.logic';
@Injectable()
export class PagarmeService {
  logger = new Logger(PagarmeService.name);

  async transaction({
    amount,
    seller,
    cardId,
    buyer,
    posts,
  }: ITransaction): Promise<string> {
    if (amount < MINIMUM_TRANSACTION_VALUE) {
      throw new BadRequestException('Invalid transaction');
    }
    const client = await pagarme.client.connect({
      api_key: configuration.pagarme.token(),
    });
    const clozeeAmount = amount * TAX_PERCENTAGE + FIXED_TAX * posts.length;
    const sellerAmount = amount - clozeeAmount;

    const response = await client.transactions.create({
      capture: true,
      async: false,
      installments: '1',
      amount,
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
          charge_processing_fee: true,
        },
        {
          recipient_id: configuration.pagarme.recipientId(),
          amount: clozeeAmount,
          liable: true,
          charge_processing_fee: false,
          charge_remainder: true,
        },
      ],
    });

    if (response.status !== 'paid') {
      throw new InternalServerErrorException('Payment denied');
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
        agencia_dv: user.bankInfo.agencyDv,
        bank_code: String(user.bankInfo.bank),
        conta: user.bankInfo.account,
        conta_dv: user.bankInfo.accountDv,
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
        recipient_id: recipientId,
        bank_account: {
          agencia: bankInfo.agency,
          agencia_dv: bankInfo.agencyDv,
          bank_code: String(bankInfo.bank),
          conta: bankInfo.account,
          conta_dv: bankInfo.accountDv,
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
