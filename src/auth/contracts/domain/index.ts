export * from './auth-responses';
export * from './token';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class AuthUser {
  @Prop()
  _id: string;
  @Prop({ required: true })
  passwordHash: string;
  @Prop({ required: true })
  salt: string;
  @Prop({ required: true })
  user: string;
}

export const AuthUserSchema = SchemaFactory.createForClass(AuthUser);
