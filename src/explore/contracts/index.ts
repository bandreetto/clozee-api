import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class ExploreCategory {
  @Prop()
  @Field()
  _id: string;
  @Prop({ required: true })
  @Field()
  name: string;
  @Prop({ required: true })
  @Field()
  searchTerm: string;
}

export const ExploreCategorySchema = SchemaFactory.createForClass(ExploreCategory);
