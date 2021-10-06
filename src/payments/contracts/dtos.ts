import { Request } from 'express';

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

export interface OrderItems {
  object: string;
  id: string;
  title: string;
  unit_price: string;
  quantity: string;
  category: string;
  tangible: string;
  venue: string;
  date: string;
}

export interface OrderPostbackBody {
  id: string;
  fingerprint: string;
  event: string;
  old_status: string;
  current_status: string;
  object: string;
  order: {
    object: string;
    id: string;
    company_id: string;
    status: string;
    amount: string;
    items: OrderItems[];
  };
  payment_link_id: string;
  postback_url: string;
  date_created: string;
}
export interface OrderPostbackRequest extends Request<{}, any, OrderPostbackBody, {}> {}
