import { HttpService, Injectable } from '@nestjs/common';
import pagarme from 'pagarme';
import { BankAccountTypes } from 'pagarme-js-types/src/client/bankAccounts/options';
import { TAX_PERCENTAGE } from 'src/common/contants';
import configuration from 'src/config/configuration';
import { Post } from 'src/posts/contracts';
import { ACCOUNT_TYPES } from 'src/users/contracts/enum';
import { FIXED_TAX, MINIMUM_TRANSACTION_VALUE } from './../common/contants';
import { User } from './../users/contracts/index';

interface ITransaction {
  seller: User;
  cardId: string;
  buyer: User;
  amount: number;
  posts: Post[];
}

interface ITransactionResponse {
  trasactionId: string;
}

interface ICreateRecipient {
  seller: User;
}

interface ICreateRecipientResponse {
  recipientId: string;
}

const formatZipCode = (zipCode: string) => {
  return zipCode.replace(/\s/g, '').replace('-', '');
};

const formatCPF = (cpf: string) => {
  return cpf.replace(/\./g, '').replace('-', '');
};

const fromAccountTypeToPagarmeType = (
  accountType: ACCOUNT_TYPES,
): BankAccountTypes => {
  switch (accountType) {
    case ACCOUNT_TYPES.CURRENT:
      return 'conta_corrente';

    case ACCOUNT_TYPES.SAVINGS:
      return 'conta_poupanca';

    case ACCOUNT_TYPES.JOINT_CURRENT:
      return 'conta_corrente_conjunta';

    case ACCOUNT_TYPES.JOINT_SAVINGS:
      return 'conta_poupanca_conjunta';

    default:
      return 'conta_corrente';
  }
};

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
      throw new Error('Invalid transaction');
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

  async createRecipient({ seller }: ICreateRecipient) {
    const response = await pagarme.client.recipients.create({
      transfer_enabled: true,
      transfer_day: '0',
      transfer_interval: 'daily',
      metadata: {},
      bank_account: {
        agencia: seller.bankInfo.agency,
        agencia_dv: seller.bankInfo.agencyDv,
        bank_code: String(seller.bankInfo.bank),
        conta: seller.bankInfo.account,
        conta_dv: seller.bankInfo.accountDv,
        document_number: formatCPF(seller.bankInfo.holderDocument),
        legal_name: seller.bankInfo.holderName,
        type: fromAccountTypeToPagarmeType(seller.bankInfo.accountType),
      },
    });

    return { recipientId: response.id };
  }
}
