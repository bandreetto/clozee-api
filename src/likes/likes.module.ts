import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from './contracts';
import { LikesResolver } from './likes.resolver';
import { LikesService } from './likes.service';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Like.name,
        schema: LikeSchema,
      },
    ]),
    PostsModule,
    UsersModule,
  ],
  providers: [LikesResolver, LikesService],
})
export class LikesModule {}
