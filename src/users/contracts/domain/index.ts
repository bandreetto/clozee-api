import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from 'src/posts/contracts/domain';

@Schema({ timestamps: true })
@ObjectType()
export class User {
  @Prop()
  @Field()
  _id: string;

  @Prop({ required: true })
  @Field()
  name: string;

  @Field(() => [Post])
  posts: Post[];

  @Prop({ required: true, index: true })
  @Field()
  username: string;

  @Field()
  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
