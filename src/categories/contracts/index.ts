import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class Category {
  @Prop()
  @Field()
  _id: string;
  @Prop({ required: true })
  @Field()
  name: string;
  @Prop({ type: String, index: true })
  @Field(() => Category, { nullable: true })
  parent: string | Category;

  @Field(() => [Category], {
    description:
      'Every parent of this category, from its direct parent to the category root.',
  })
  ancestrals: Category[];

  @Field(() => [Category])
  children: Category[];

  path: Category[];
  depht: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
