import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthUser, AuthUserSchema } from './contracts/domain';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuthUser.name,
        schema: AuthUserSchema,
      },
    ]),
    UsersModule,
  ],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}