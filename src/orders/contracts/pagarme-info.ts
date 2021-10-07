import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class PagarmeInfo {
  @Prop()
  pagarmeOrderId: string;
  @Prop()
  pagarmeTransactionId: string;
  @Prop()
  paymentLinkId?: string;
}

export const PagarmeInfoSchema = SchemaFactory.createForClass(PagarmeInfo);
