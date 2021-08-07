import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class GroupParticipant {
  @Prop()
  _id: string;

  @Prop({ index: true })
  user: string;

  @Prop({ index: true })
  group: string;
}

export const GroupParticipantSchema = SchemaFactory.createForClass(GroupParticipant);
