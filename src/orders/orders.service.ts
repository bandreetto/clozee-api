import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Order } from './contracts';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order & Document>,
  ) {}

  async findById(orderId: string) {
    return this.orderModel.findById(orderId).lean();
  }

  async create(order: Order): Promise<Order> {
    const newOrder = await this.orderModel.create(order);
    return newOrder.toObject();
  }
}
