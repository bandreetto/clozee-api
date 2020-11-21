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
    return this.notificationModel.find({ user: userId }).lean();
  }

  async createNotification<T extends Notification>(
    notification: T,
  ): Promise<T> {
    const createdNotification = await this.notificationModel.create(
      notification,
    );
    return createdNotification.toObject();
  }
}
