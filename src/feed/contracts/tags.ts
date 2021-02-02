import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SIZES } from 'src/posts/contracts/enums';
import { GENDER_TAGS } from 'src/users/contracts/enum';

@Schema({ _id: false })
export class Tags {
  @Prop({ enum: Object.values(SIZES), required: true })
  size: SIZES;
  @Prop({ enum: Object.values(GENDER_TAGS), required: true })
  gender: GENDER_TAGS;
}

export const TagsSchema = SchemaFactory.createForClass(Tags);

TagsSchema.index({
  size: 1,
  gender: 1,
});
