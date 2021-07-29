import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { GroupsResolver } from './groups.resolver';

@Module({
  imports: [PostsModule, UsersModule],
  providers: [GroupsResolver],
})
export class GroupsModule {}
