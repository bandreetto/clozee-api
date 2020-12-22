import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class SavedPost {
  @Prop({ required: true })
  user: string;
  @Prop({ required: true })
  post: string;
  @Prop({ default: true })
  saved: boolean;

  updatedAt?: Date;
}
export const SavedPostSchema = SchemaFactory.createForClass(SavedPost);
SavedPostSchema.index({
  saved: 1,
  user: 1,
});
SavedPostSchema.index({
  user: 1,
  post: 1,
});
