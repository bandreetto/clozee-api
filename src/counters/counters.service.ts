import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Counter } from './contracts';

@Injectable()
export class CountersService {
  logger = new Logger(CountersService.name);
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<Counter & Document>,
  ) {}

  async getCounterAndIncrement(collectionName: string): Promise<number> {
    const counterDocument = await this.counterModel.findByIdAndUpdate(collectionName, {
      $inc: { counter: 1 },
    });
    if (counterDocument) return counterDocument.counter;

    this.counterModel.insertMany([
      {
        _id: collectionName,
        counter: 2,
      },
    ]);
    return 1;
  }
}
