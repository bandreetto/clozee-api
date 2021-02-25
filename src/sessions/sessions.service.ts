import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Session } from './contracts';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session & Document>,
  ) {}

  async create(session: Session): Promise<Session> {
    const createdSession = await this.sessionModel.create(session);
    return createdSession.toObject();
  }

  async terminate(sessionIds: string[]): Promise<void> {
    await this.sessionModel.updateMany(
      { _id: { $in: sessionIds } },
      {
        $set: { terminatedAt: new Date() },
      },
    );
  }

  async findByUser(userId: string, open?: boolean): Promise<Session[]> {
    return this.sessionModel
      .find({ user: userId, terminatedAt: { $exists: !open } })
      .lean();
  }
}
