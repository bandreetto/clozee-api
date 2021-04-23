export * from './pagination';
export * from './user-feed';

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

  @Prop({ required: true })
  score: number;

  searchScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);
