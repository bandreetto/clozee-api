import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts';

export interface ITransaction {
  clozeeAmount: number;
  sellerAmount: number;
  seller: User;
  cardId: string;
  buyer: User;
  deliveryFee: number;
  posts: Post[];
}

export interface ITransactionResponse {
  trasactionId: string;
}
export interface IRecipientResponse {
  recipientId: string;
}

export interface ICreateCardResponse {
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
  customer: null;
  valid: boolean;
  expiration_date: string;
}
