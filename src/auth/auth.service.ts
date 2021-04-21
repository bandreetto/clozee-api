import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, ClientSession } from 'mongoose';
import { AuthUser } from './contracts';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthUser.name)
    private readonly authUserModel: Model<AuthUser & Document>,
  ) {}

  async create(authUser: AuthUser, session: ClientSession): Promise<AuthUser> {
    const [createdUser] = await this.authUserModel.create([authUser], {
      session,
    });
    return createdUser.toObject();
  }

  async findByUser(user: string): Promise<AuthUser> {
    return this.authUserModel.findOne({ user }).lean();
  }
}
