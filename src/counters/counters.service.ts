import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, ClientSession } from 'mongoose';
import { Counter } from './contracts';

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<Counter & Document>,
  ) {}

  async getCounterAndIncrement(
    collectionName: string,
    session?: ClientSession,
  ): Promise<number> {
    const counterDocument = await this.counterModel.findByIdAndUpdate(
      collectionName,
      {
        $inc: { counter: 1 },
      },
      {
        session,
      },
    );
    return counterDocument.counter;
  }
}
