export type BankAccountTypes =
  | 'conta_corrente'
  | 'conta_poupanca'
  | 'conta_corrente_conjunta'
  | 'conta_poupanca_conjunta';

export interface BankAccountCreateOptions {
  agencia: string;
  agencia_dv: string;
  bank_code: string;
  conta: string;
  conta_dv: string;
  document_number: string;
  legal_name: string;
  type: BankAccountTypes;
}
