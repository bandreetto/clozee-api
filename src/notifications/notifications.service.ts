import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Notification } from './contracts';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification & Document>,
  ) {}

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create<T extends Notification>(notification: T): Promise<T> {
    const newNotification = await this.notificationModel.create(notification);
    return newNotification.toObject();
  }

  async createMany<T extends Notification>(notifications: T[]): Promise<T[]> {
    const createdNotifications = (await this.notificationModel.insertMany(
      notifications,
    )) as Array<Notification & Document>;
    return createdNotifications.map(o => o.toObject());
  }
}
