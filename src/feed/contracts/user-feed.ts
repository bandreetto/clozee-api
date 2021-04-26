import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Tags, TagsSchema } from './tags';

@Schema({ timestamps: true })
export class UserFeed {
  @Prop()
  _id?: string;

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

export const UserFeedSchema = SchemaFactory.createForClass(UserFeed);

UserFeedSchema.index({
  user: 1,
  score: -1,
  createdAt: -1,
  'tags.size': 1,
  'tags.gender': 1,
  post: 1,
});

UserFeedSchema.index({
  createdAt: -1,
  'tags.size': 1,
  'tags.gender': 1,
  post: 1,
});
