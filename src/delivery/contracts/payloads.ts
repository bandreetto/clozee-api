import { Order } from 'src/orders/contracts';
import { Post } from 'src/posts/contracts';

export interface DeliveryMenvCheckoutPayload {
  menvDeliveryOrderId: string;
  labelUrl: string;
  order: Order;
  posts: Post[];
}
