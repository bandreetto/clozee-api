import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from 'src/users/contracts/domain';
import { Comment } from 'src/comments/contracts/domain';

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

  @Prop({ required: true })
  @Field()
  size: string;

  @Prop()
  @Field({ nullable: true })
  description: string;

  @Prop({ type: [String], default: [] })
  @Field(() => [String], { description: 'An array of urls for post images' })
  images: string[];

  @Prop({ type: [String], default: [] })
  @Field(() => [String], {
    description: 'An array of strings representing the post categories',
  })
  categories: string[];

  @Field(() => [Comment])
  comments: Comment[];

  @Prop({ required: true })
  @Field({ description: 'Price of the item being announced in cents' })
  price: number;

  @Field()
  createdAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
