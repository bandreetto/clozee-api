import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Follow } from './contracts';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<Follow & Document>,
  ) {}

  async upsertFollow({ _id, ...follow }: Follow): Promise<Follow> {
    return this.followModel
      .findByIdAndUpdate(_id, follow, {
        upsert: true,
        new: true,
      })
      .lean();
  }
}
