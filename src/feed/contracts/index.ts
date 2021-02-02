export * from './pagination';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Tags, TagsSchema } from './tags';

@Schema({ timestamps: true })
export class Feed {
  @Prop()
  _id: string;

  @Prop({ required: true })
  post: string;

  @Prop({ type: TagsSchema, required: true })
  tags: Tags;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);
