import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { Order } from '.';

@Schema({ timestamps: true })
export class Sale {
  @Prop()
  _id: string;

  @Prop({ type: String, unique: true })
  post: string | Post;

  @Prop({ type: String })
  order: string | Order;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
