import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts';

export interface ITransaction {
  seller: User;
  cardId: string;
  buyer: User;
  amount: number;
  posts: Post[];
}

export interface ITransactionResponse {
  trasactionId: string;
}
export interface IRecipientResponse {
  recipientId: string;
}
