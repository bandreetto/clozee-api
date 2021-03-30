import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { Follow, FollowSchema } from './contracts';
import { FollowsLoader } from './follows.dataloader';
import { FollowsResolver } from './follows.resolver';
import { FollowsService } from './follows.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Follow.name,
        schema: FollowSchema,
      },
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [FollowsResolver, FollowsService, FollowsLoader],
  exports: [FollowsService, FollowsLoader],
})
export class FollowsModule {}
