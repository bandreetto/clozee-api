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
    payment_link_id: string;
    postback_url: string;
    date_created: string;
  };
}
export interface OrderPostbackRequest extends Request<{}, any, OrderPostbackBody, {}> {}

export interface CustomerDocument {
  object: string;
  id: string;
  type: string;
  number: string;
}

export interface TransactionPostbackBody {
  id: string;
  fingerprint: string;
  evebt: string;
  old_status: string;
  desired_status: string;
  current_status: string;
  object: string;
  transaction: {
    object: string;
    status: string;
    refuse_reason: string;
    status_reason: string;
    acquirer_response_code: string;
    acquirer_name: string;
    acquirer_id: string;
    authorization_code: string;
    soft_descriptor: string;
    tid: string;
    nsu: string;
    date_created: string;
    date_updated: string;
    amount: string;
    authorized_amount: string;
    paid_amount: string;
    refunded_amount: string;
    installments: string;
    id: string;
    cost: string;
    card_holder_name: string;
    card_last_digits: string;
    card_first_digits: string;
    card_brand: string;
    card_pin_mode: string;
    card_magstripe_fallback: string;
    cvm_pin: string;
    postback_url: string;
    payment_method: string;
    capture_method: string;
    antifraud_score: string;
    boleto_url: string;
    boleto_barcode: string;
    boleto_expiration_date: string;
    referer: string;
    ip: string;
    subscription_id: string;
    phone: string;
    address: string;
    customer: {
      object: string;
      id: string;
      external_id: string;
      type: string;
      country: string;
      document_number: string;
      document_type: string;
      name: string;
      email: string;
      phone_numbers: string[];
      born_at: string;
      birthday: string;
      gender: string;
      date_created: string;
      documents: CustomerDocument[];
    };
    billing: {
      object: string;
      id: string;
      name: string;
      address: {
        object: string;
        street: string;
        complementary: string;
        street_number: string;
        neighborhood: string;
        city: string;
        state: string;
        zipcode: string;
        country: string;
        id: string;
      };
    };
    shipping: string;
    card: {
      object: string;
      id: string;
      date_created: string;
      date_updated: string;
      brand: string;
      holder_name: string;
      first_digits: string;
      last_digits: string;
      country: string;
      fingerprint: string;
      valid: string;
      expiration_date: string;
    };
    split_rules: string;
    reference_key: string;
    device: { session: string };
    local_transaction_id: string;
    local_time: string;
    fraud_covered: string;
    fraud_reimbursed: string;
    order_id: string;
    risk_level: string;
    receipt_url: string;
    payment: string;
    addition: string;
    discount: string;
    private_label: string;
    pix_qr_code: string;
    pix_expiration_date: string;
  };
}
export interface TransactionPostbackRequest extends Request<{}, any, TransactionPostbackBody, {}> {}
