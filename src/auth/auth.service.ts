import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from 'src/users/contracts/domain';
import { AuthUser } from './contracts/domain';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthUser.name)
    private readonly authUserModel: Model<AuthUser & Document>,
  ) {}

  create(authUser: AuthUser): Promise<AuthUser> {
    return this.authUserModel.create(authUser);
  }

  async findByUser(user: string): Promise<AuthUser> {
    return this.authUserModel.findOne({ user }).lean();
  }
}
