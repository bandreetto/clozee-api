import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class GroupPost {
  @Prop()
  _id: string;

  @Prop({ required: true, index: true })
  post: string;

  @Prop({ required: true, index: true })
  group: string;
}

export const GroupPostSchema = SchemaFactory.createForClass(GroupPost);
