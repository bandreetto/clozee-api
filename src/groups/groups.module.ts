import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { Group, GroupParticipant, GroupParticipantSchema, GroupPost, GroupPostSchema, GroupSchema } from './contracts';
import { GroupsLoader } from './groups.dataloader';
import { GroupsResolver } from './groups.resolver';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Group.name,
        schema: GroupSchema,
      },
      {
        name: GroupParticipant.name,
        schema: GroupParticipantSchema,
      },
      {
        name: GroupPost.name,
        schema: GroupPostSchema,
      },
    ]),
    PostsModule,
    UsersModule,
  ],
  providers: [GroupsResolver, GroupsService, GroupsLoader],
  exports: [GroupsLoader, GroupsService],
})
export class GroupsModule {}
