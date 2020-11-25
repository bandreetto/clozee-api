import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Bank } from './contracts';

@Injectable()
export class BanksService {
  constructor(
    @InjectModel(Bank.name) private readonly bankModel: Model<Bank & Document>,
  ) {}

  async find(): Promise<Bank[]> {
    return this.bankModel.find().lean();
  }
}
