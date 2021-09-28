import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class SeenPost {
  @Prop()
  _id: string;

  @Prop({ required: true })
  post: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true, index: true })
  session: string;
}

export const SeenPostSchema = SchemaFactory.createForClass(SeenPost);
