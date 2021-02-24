import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { Order } from './contracts';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order & Document>,
  ) {}

  async findById(orderId: string): Promise<Order> {
    return this.orderModel.findById(orderId).lean();
  }

  async findManyByIds(orderIds: string[]): Promise<Order[]> {
    return this.orderModel.find({ _id: { $in: orderIds } }).lean();
  }

  async findByBuyer(userId: string): Promise<Order[]> {
    return this.orderModel.find({ buyer: userId }).lean();
  }

  async findManyByBuyers(userIds: string[]): Promise<Order[]> {
    return this.orderModel
      .find({
        buyer: { $in: userIds },
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(order: Order): Promise<Order> {
    const newOrder = await this.orderModel.create(order);
    return newOrder.toObject();
  }

  async update(orderId: string, fields: Partial<Order>): Promise<Order> {
    return this.orderModel
      .findOneAndUpdate({ _id: orderId }, { $set: { ...fields } })
      .lean();
  }
}
