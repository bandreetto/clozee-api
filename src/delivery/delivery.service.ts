import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Delivery } from './contracts';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name)
    private readonly deliveryInfoModel: Model<Delivery & Document>,
  ) {}

  async findById(deliveryId: string): Promise<Delivery> {
    return this.deliveryInfoModel.findById(deliveryId).lean();
  }

  async upsert({ _id, ...fields }: Delivery): Promise<Delivery> {
    return this.deliveryInfoModel
      .findByIdAndUpdate(
        _id,
        {
          $set: fields,
        },
        { upsert: true, new: true },
      )
      .lean();
  }
}
