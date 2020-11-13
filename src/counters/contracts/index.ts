import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Counter {
  /**
   * The _id is the collection name
   */
  @Prop()
  _id: string;
  @Prop({ required: true, default: 2 })
  counter: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
