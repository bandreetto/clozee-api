import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthUser, AuthUserSchema } from './contracts';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import configuration from 'src/config/configuration';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuthUser.name,
        schema: AuthUserSchema,
      },
    ]),
    JwtModule.register({
      secret: configuration.auth.secret(),
    }),
    UsersModule,
  ],
  exports: [JwtModule],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
