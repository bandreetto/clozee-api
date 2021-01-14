import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like, LikeSchema } from './contracts';
import { LikesResolver } from './likes.resolver';
import { LikesService } from './likes.service';
import { PostsModule } from '../posts/posts.module';
import { LikesLoader } from './likes.dataloader';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Like.name,
        schema: LikeSchema,
      },
    ]),
    forwardRef(() => PostsModule),
  ],
  providers: [LikesResolver, LikesService, LikesLoader],
  exports: [LikesService, LikesLoader],
})
export class LikesModule {}
