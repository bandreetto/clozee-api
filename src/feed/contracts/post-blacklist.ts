import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PostBlacklist {
  @Prop()
  _id: string;

  @Prop({ required: true })
  user: string;

  @Prop({ type: [String], default: [] })
  posts: string[];

  @Prop({ type: [String], default: [] })
  blockedUsersPosts?: string[];
}

export const PostBlacklistSchema = SchemaFactory.createForClass(PostBlacklist);
