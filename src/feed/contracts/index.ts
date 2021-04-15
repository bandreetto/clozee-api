export * from './pagination';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Tags, TagsSchema } from './tags';

@Schema({ timestamps: true })
export class Feed {
  @Prop()
  _id: string;

  @Prop({ required: true, index: true })
  post: string;

  @Prop({ type: TagsSchema, required: true })
  tags: Tags;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true, index: true })
  user: string;

  searchScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);

FeedSchema.index({
  user: 1,
  score: -1,
  createdAt: -1,
  'tags.size': 1,
  'tags.gender': 1,
  post: 1,
});

FeedSchema.index({
  createdAt: -1,
  'tags.size': 1,
  'tags.gender': 1,
  post: 1,
});
