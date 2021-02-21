interface DeliveryRange {
  min: number;
  max: number;
}

interface CustomDeliveryRange {
  min: number;
  max: number;
}

interface Dimensions {
  height: number;
  width: number;
  length: number;
}

interface Package {
  price: string;
  discount: string;
  format: string;
  dimensions: Dimensions;
  weight: string;
  insurance_value: string;
}

interface AdditionalServices {
  receipt: boolean;
  own_hand: boolean;
  collect: boolean;
}

interface Company {
  id: number;
  name: string;
  picture: string;
}

export interface MenvCalculateResponse {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: DeliveryRange;
  custom_delivery_time: number;
  custom_delivery_range: CustomDeliveryRange;
  packages: Package[];
  additional_services: AdditionalServices;
  company: Company;
}

interface Product {
  name: string;
  quantity: number;
  unitary_value: number;
  weight?: any;
}

interface Volume {
  id: number;
  height: string;
  width: string;
  length: string;
  diameter: string;
  weight: string;
  format: string;
  created_at: string;
  updated_at: string;
}

interface Tag {
  tag: string;
  url?: any;
}

export interface MenvAddToCartResponse {
  id: string;
  protocol: string;
  service_id: number;
  agency_id?: any;
  contract: string;
  service_code?: any;
  quote: number;
  price: number;
  coupon?: any;
  discount: number;
  delivery_min: number;
  delivery_max: number;
  status: string;
  reminder?: any;
  insurance_value: number;
  weight?: any;
  width?: any;
  height?: any;
  length?: any;
  diameter?: any;
  format: string;
  billed_weight: number;
  receipt: boolean;
  own_hand: boolean;
  collect: boolean;
  collect_scheduled_at?: any;
  reverse: boolean;
  non_commercial: boolean;
  authorization_code?: any;
  tracking?: any;
  self_tracking?: any;
  delivery_receipt?: any;
  additional_info?: any;
  cte_key?: any;
  paid_at?: any;
  generated_at?: any;
  posted_at?: any;
  delivered_at?: any;
  canceled_at?: any;
  suspended_at?: any;
  expired_at?: any;
  created_at: string;
  updated_at: string;
  parse_pi_at?: any;
  products: Product[];
  volumes: Volume[];
  tags: Tag[];
}

interface Reason {
  id: number;
  label: string;
  description: string;
}

interface Transaction {
  id: string;
  protocol: string;
  value: number;
  type: string;
  status: string;
  description: string;
  authorized_at: string;
  unauthorized_at?: any;
  reserved_at?: any;
  canceled_at?: any;
  created_at: string;
  description_internal?: any;
  reason: Reason;
}

interface From {
  name: string;
  phone: string;
  email: string;
  document: string;
  company_document?: any;
  state_register?: any;
  postal_code: string;
  address: string;
  location_number: string;
  complement: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
  latitude?: any;
  longitude?: any;
  note: string;
}

interface To {
  name: string;
  phone: string;
  email: string;
  document: string;
  company_document?: any;
  state_register?: any;
  postal_code: string;
  address: string;
  location_number: string;
  complement: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
  latitude?: any;
  longitude?: any;
  note: string;
}

interface Company {
  id: number;
  name: string;
  status: string;
  picture: string;
  use_own_contract: boolean;
}

interface Service {
  id: number;
  name: string;
  status: string;
  type: string;
  range: string;
  restrictions: string;
  requirements: string;
  optionals: string;
  company: Company;
}

interface Tag {
  tag: string;
  url?: any;
}

interface Product {
  name: string;
  quantity: number;
  unitary_value: number;
  weight?: any;
}

interface Order {
  id: string;
  protocol: string;
  service_id: number;
  agency_id?: any;
  contract: string;
  service_code?: any;
  quote: number;
  price: number;
  coupon?: any;
  discount: number;
  delivery_min: number;
  delivery_max: number;
  status: string;
  reminder?: any;
  insurance_value: number;
  weight?: any;
  width?: any;
  height?: any;
  length?: any;
  diameter?: any;
  format: string;
  billed_weight: number;
  receipt: boolean;
  own_hand: boolean;
  collect: boolean;
  collect_scheduled_at?: any;
  reverse: boolean;
  non_commercial: boolean;
  authorization_code?: any;
  tracking?: any;
  self_tracking?: any;
  delivery_receipt?: any;
  additional_info?: any;
  cte_key?: any;
  paid_at: string;
  generated_at?: any;
  posted_at?: any;
  delivered_at?: any;
  canceled_at?: any;
  suspended_at?: any;
  expired_at?: any;
  created_at: string;
  updated_at: string;
  parse_pi_at?: any;
  from: From;
  to: To;
  service: Service;
  agency?: any;
  invoice?: any;
  tags: Tag[];
  products: Product[];
  generated_key?: any;
}

interface Purchase {
  id: string;
  protocol: string;
  total: number;
  discount: number;
  status: string;
  paid_at: string;
  canceled_at?: any;
  created_at: string;
  updated_at: string;
  payment?: any;
  transactions: Transaction[];
  orders: Order[];
  paypal_discounts: any[];
}

export interface MenvCheckoutResponse {
  purchase: Purchase;
  digitable?: any;
  redirect?: any;
  message?: any;
  token?: any;
  payment_id?: any;
}
