import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SIZES } from '../../posts/contracts/enums';
import { GENDER_TAGS } from '../../users/contracts/enum';

@Schema({ _id: false })
export class Tags {
  @Prop({ enum: Object.values(SIZES), required: true })
  size: SIZES;
  @Prop({ enum: Object.values(GENDER_TAGS), required: true })
  gender: GENDER_TAGS;
  @Prop()
  searchTerms: string[];
}

export const TagsSchema = SchemaFactory.createForClass(Tags);
