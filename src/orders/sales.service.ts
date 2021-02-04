import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Sale } from './contracts';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale & Document>,
  ) {}

  async createMany(sales: Sale[]): Promise<Sale[]> {
    const session = await this.saleModel.db.startSession();
    let newSales: (Sale & Document)[];
    await session
      .withTransaction(async () => {
        newSales = await this.saleModel.insertMany(sales, { session });
      })
      .catch(err => {
        session.endSession();
        throw err;
      });
    session.endSession();
    return newSales.map(s => s.toObject());
  }

  async findManyByPosts(postIds: string[]): Promise<Sale[]> {
    return this.saleModel.find({ post: { $in: postIds } }).lean();
  }

  async findByOrders(orderIds: string[]): Promise<Sale[]> {
    return this.saleModel.find({ order: { $in: orderIds } });
  }
}
