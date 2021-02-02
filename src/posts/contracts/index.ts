import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from 'src/users/contracts';
import { Comment } from 'src/comments/contracts';
import { Category } from 'src/categories/contracts';
import { POST_CONDITIONS, SIZES } from './enums';

@Schema({ timestamps: true })
@ObjectType()
export class Post {
  @Prop()
  @Field()
  _id: string;

  @Prop({ type: String, required: true })
  @Field(() => User)
  user: User | string;

  @Prop({ required: true })
  @Field()
  title: string;

  @Prop({ type: SIZES, required: true })
  @Field(() => SIZES, {
    description: 'Size of the product being announced on this post.',
  })
  size: SIZES;

  @Prop()
  @Field({ nullable: true })
  description: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { description: 'An array of urls for post images.' })
  images: string[];

  @Prop({ type: String, required: true })
  @Field(() => Category, {
    description: 'The category of this post.',
  })
  category: string | Category;

  @Prop({ required: true })
  @Field({ description: 'Price of the item being announced in cents.' })
  price: number;

  @Prop({ required: true })
  @Field(() => POST_CONDITIONS, {
    description: "The condition of the post's product",
  })
  condition: POST_CONDITIONS;

  @Field(() => [Comment])
  comments: Comment[];

  @Field({
    description: 'A boolean indicating whether this post was sold or not.',
  })
  sold?: boolean;

  @Field({
    description:
      'A boolean indicating whether this post is saved by the current user or not. If the request is not authenticated, this returns false.',
  })
  saved?: boolean;

  @Field({ description: 'The amount of likes this post had.' })
  likes?: number;

  @Field({
    description:
      'A boolean indicating if the current user has liked this post. If the request is not authenticated then this returns false.',
  })
  liked?: boolean;

  @Field()
  createdAt?: Date;

  @Prop({ default: false })
  deleted?: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
