import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, ClientSession } from 'mongoose';
import { SORT_DIRECTION, TransactionableService } from 'src/common/types';
import { Order, Sale } from './contracts';

@Injectable()
export class OrdersService implements TransactionableService<ClientSession> {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order & Document>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale & Document>,
  ) {}

  async startTransaction(): Promise<ClientSession> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await session.commitTransaction();
    return session.endSession();
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await session.abortTransaction();
    return session.endSession();
  }

  async findById(orderId: string): Promise<Order> {
    return this.orderModel.findById(orderId).lean();
  }

  async findManyByIds(orderIds: string[]): Promise<Order[]> {
    return this.orderModel
      .find({ _id: { $in: orderIds } })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByBuyer(userId: string): Promise<Order[]> {
    return this.orderModel.find({ buyer: userId }).sort({ createdAt: -1 }).lean();
  }

  async findManyByBuyers(userIds: string[]): Promise<Order[]> {
    return this.orderModel
      .find({
        buyer: { $in: userIds },
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(order: Order, session?: ClientSession): Promise<Order> {
    const [newOrder] = await this.orderModel.create([order], { session });
    return newOrder.toObject();
  }

  async update(orderId: string, fields: Partial<Order>): Promise<Order> {
    return this.orderModel.findOneAndUpdate({ _id: orderId }, { $set: { ...fields } }).lean();
  }

  async createSales(sales: Sale[], session?: ClientSession): Promise<Sale[]> {
    const newSales = await this.saleModel.insertMany(sales, { session });
    return newSales.map(s => s.toObject());
  }

  async updateSaleByPost(postId: string, fields: Partial<Sale>): Promise<Sale> {
    return this.saleModel
      .findOneAndUpdate(
        {
          post: postId,
        },
        { $set: { ...fields } },
      )
      .lean();
  }

  async findSalesByPosts(postIds: string[]): Promise<Sale[]> {
    return this.saleModel.find({ post: { $in: postIds } }).lean();
  }

  async findSalesByOrders(orderIds: string[]): Promise<Sale[]> {
    return this.saleModel.find({ order: { $in: orderIds } });
  }

  async groupBySellers(limit: number, sort: SORT_DIRECTION): Promise<{ user: string; salesCount: number }[]> {
    const userSales = await this.saleModel.aggregate<{ _id: [string]; salesCount: number }>([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'populatedPost',
        },
      },
      {
        $group: {
          _id: '$populatedPost.user',
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { salesCount: sort } },
      { $limit: limit },
    ]);

    return userSales.map(us => ({ user: us._id[0], salesCount: us.salesCount }));
  }
}
