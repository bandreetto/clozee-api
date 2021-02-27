import { BankAccountTypes } from 'pagarme-js-types/src/client/bankAccounts/options';
import { ACCOUNT_TYPES } from 'src/users/contracts/enum';

export const formatZipCode = (zipCode: string) => {
  return zipCode.replace(/\s/g, '').replace('-', '');
};

export const formatCPF = (cpf: string) => {
  return cpf.replace(/\./g, '').replace('-', '');
};

export const fromAccountTypeToPagarmeType = (
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
