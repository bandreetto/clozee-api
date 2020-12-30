export * from './pagination';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Feed {
  @Prop()
  _id: string;

  @Prop()
  post: string;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);
