import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts';

@Schema({ timestamps: true })
export class Like {
  @Prop()
  _id: string;

  @Prop()
  deleted: boolean;

  @Prop({ type: String, required: true, index: true })
  post: string | Post;

  @Prop({ type: String, required: true })
  user: string | User;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
