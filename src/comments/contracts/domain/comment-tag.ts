import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/users/contracts/domain';

@Schema({ _id: false })
@ObjectType()
export class CommentTag {
  @Prop({ required: true })
  @Field(() => Int, { description: 'The char index where the tag starts' })
  bodyIndex: number;

  @Prop({ type: String, required: true })
  @Field(() => User, { description: 'The user tagged' })
  user: User | string;
}

export const CommentTagSchema = SchemaFactory.createForClass(CommentTag);
