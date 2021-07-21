import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SIZES } from '../../posts/contracts/enums';
import { GENDER_TAGS } from './enum';

@Schema({ _id: false })
@ObjectType()
export class FeedTags {
  @Prop({ type: [String], enum: Object.values(SIZES), default: [] })
  @Field(() => [SIZES], { description: 'User sizes preferences.' })
  sizes: SIZES[];
  @Prop({ type: [String], enum: Object.values(GENDER_TAGS), default: [] })
  @Field(() => [GENDER_TAGS], {
    nullable: true,
    description: 'User clothing model preference.',
  })
  genders: GENDER_TAGS[];
}

export const FeedTagsSchema = SchemaFactory.createForClass(FeedTags);
