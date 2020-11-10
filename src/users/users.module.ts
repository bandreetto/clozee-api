import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Address,
  AddressSchema,
  SavedPost,
  SavedPostSchema,
  User,
  UserSchema,
} from './contracts';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PostsModule } from 'src/posts/posts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: SavedPost.name,
        schema: SavedPostSchema,
      },
    ]),
    forwardRef(() => PostsModule),
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
