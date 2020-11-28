import { Post } from 'src/posts/contracts';
import { Order } from '.';

export class OrderCreatedPayload {
  order: Order;
  posts: Post[];
}
