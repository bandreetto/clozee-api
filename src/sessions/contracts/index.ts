import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Field, ObjectType } from '@nestjs/graphql';

@Schema({ timestamps: true })
@ObjectType()
export class Session {
  @Prop()
  @Field()
  _id: string;

  @Prop({ index: true })
  user?: string;

  @Prop()
  terminatedAt?: Date;

  createdAt?: Date;
  udpatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
