import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { Group } from 'src/groups/contracts';
import { GroupsLoader } from 'src/groups/groups.dataloader';
import { User } from 'src/users/contracts';
import { UsersLoader } from 'src/users/users.dataloaders';
import { GroupInviteNotification } from './contracts';

@Resolver(() => GroupInviteNotification)
export class GroupInviteNotificationResolver {
  constructor(private readonly groupsLoader: GroupsLoader, private readonly usersLoader: UsersLoader) {}

  @ResolveField()
  async group(@Root() notification: GroupInviteNotification): Promise<Group> {
    if (typeof notification.group !== 'string') return notification.group;
    return this.groupsLoader.load(notification.group);
  }

  @ResolveField()
  async inviter(@Root() notification: GroupInviteNotification): Promise<User> {
    if (typeof notification.inviter !== 'string') return notification.inviter;
    return this.usersLoader.load(notification.inviter);
  }
}
