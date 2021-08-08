import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../users/contracts';
import { Comment } from '../../comments/contracts';
import { Category } from '../../categories/contracts';
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

  @Prop()
  @Field({ nullable: true })
  title?: string;

  @Prop({ type: SIZES })
  @Field(() => SIZES, {
    description: 'Size of the product being announced on this post.',
    nullable: true,
  })
  size?: SIZES;

  @Prop()
  @Field({ nullable: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { description: 'An array of urls for post images.' })
  images: string[];

  @Prop({ type: String })
  @Field(() => Category, {
    description: 'The category of this post.',
    nullable: true,
  })
  category?: string | Category;

  @Prop()
  @Field({ description: 'Price of the item being announced in cents.', nullable: true })
  price?: number;

  @Prop({ min: 0, max: 100, default: 0 })
  @Field({
    defaultValue: 0,
    description: "The percentage of the seller's profit being destined to donation.",
  })
  donationPercentage?: number;

  @Field(() => Int, {
    description: "The calculated amount of the post's price going to donation in cents.",
  })
  donationAmount?: number;

  @Prop()
  @Field(() => POST_CONDITIONS, {
    description: "The condition of the post's product",
    nullable: true,
  })
  condition?: POST_CONDITIONS;

  @Prop({ default: [] })
  reportedBy?: string[];

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

  @Prop({
    type: String,
    required: true,
    enum: ['FeedPost', 'GroupPost'],
    default: 'FeedPost',
  })
  @Field(() => String, { defaultValue: 'FeedPost' })
  type: 'FeedPost' | 'GroupPost';
}

export const PostSchema = SchemaFactory.createForClass(Post);
