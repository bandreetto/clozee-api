import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Follow {
  @Prop()
  _id: string;

  @Prop({ required: true })
  follower: string;

  @Prop({ required: true })
  followee: string;

  @Prop()
  deleted: boolean;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
