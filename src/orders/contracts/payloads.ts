import { Post } from 'src/posts/contracts';
import { Order } from '.';

export interface OrderCreatedPayload {
  order: Order;
  posts: Post[];
}
