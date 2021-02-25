import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import pagarme from 'pagarme';
import { TAX_PERCENTAGE } from 'src/common/contants';
import configuration from 'src/config/configuration';
import { User } from 'src/users/contracts';
import { FIXED_TAX, MINIMUM_TRANSACTION_VALUE } from './../common/contants';
import {
  ICreateCardResponse,
  IRecipientResponse,
  ITransaction,
  ITransactionResponse,
} from './contracts';
import {
  formatCPF,
  formatZipCode,
  fromAccountTypeToPagarmeType,
} from './payments.logic';

@Injectable()
export class PagarmeService {
  constructor(private readonly httpClient: HttpService) {}

  async transaction({
    amount,
    seller,
    cardId,
    buyer,
    posts,
  }: ITransaction): Promise<ITransactionResponse> {
    if (amount < MINIMUM_TRANSACTION_VALUE) {
      throw new BadRequestException('Invalid transaction');
    }

    const sellerAmount = amount * (1 - TAX_PERCENTAGE) - FIXED_TAX;
    const sellerPercentage = sellerAmount / amount;
    const clozeePercentage = 1 - sellerPercentage;

    const response = await pagarme.client.transactions.create({
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
        phone_numbers: [buyer.phoneNumber],
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
          percentage: sellerPercentage,
          liable: true,
          charge_processing_fee: true,
        },
        {
          recipient_id: configuration.pagarme.recipientId(),
          percentage: clozeePercentage,
          liable: true,
          charge_processing_fee: false,
          charge_remainder: true,
        },
      ],
    });

    if (response.status !== 'paid') {
      throw new Error('Paymen denied');
    }

    return { trasactionId: response.tid };
  }

  async createRecipient(user: User): Promise<IRecipientResponse> {
    const response = await pagarme.client.recipients.create({
      transfer_enabled: true,
      transfer_day: '0',
      transfer_interval: 'daily',
      metadata: {},
      bank_account: {
        agencia: user.bankInfo.agency,
        agencia_dv: user.bankInfo.agencyDv,
        bank_code: String(user.bankInfo.bank),
        conta: user.bankInfo.account,
        conta_dv: user.bankInfo.accountDv,
        document_number: formatCPF(user.bankInfo.holderDocument),
        legal_name: user.bankInfo.holderName,
        type: fromAccountTypeToPagarmeType(user.bankInfo.accountType),
      },
    });

    return { recipientId: response.id };
  }

  async updateRecipient(
    bankInfo: User['bankInfo'],
    recipientId: string,
  ): Promise<IRecipientResponse> {
    const response = await pagarme.client.recipients.update({
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

    return { recipientId: response.id };
  }

  async createCard(cardHash: string): Promise<ICreateCardResponse> {
    const response = await pagarme.client.cards.create(
      {},
      { card_hash: cardHash },
    );

    return response.data as ICreateCardResponse;
  }
}
