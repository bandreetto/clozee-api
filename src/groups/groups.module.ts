import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { Group, GroupParticipant, GroupParticipantSchema, GroupSchema } from './contracts';
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
    ]),
    PostsModule,
    UsersModule,
  ],
  providers: [GroupsResolver, GroupsService],
})
export class GroupsModule {}
