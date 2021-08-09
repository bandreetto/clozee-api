import { ResolveField, Resolver, Root } from '@nestjs/graphql';
import { Group } from 'src/groups/contracts';
import { GroupsLoader } from 'src/groups/groups.dataloader';
import { User } from 'src/users/contracts';
import { UsersLoader } from 'src/users/users.dataloaders';
import { GroupPostNotification } from './contracts';

@Resolver(() => GroupPostNotification)
export class GroupPostNotificationResolver {
  constructor(private readonly groupsLoader: GroupsLoader, private readonly usersLoader: UsersLoader) {}

  @ResolveField()
  async group(@Root() notification: GroupPostNotification): Promise<Group> {
    if (typeof notification.group !== 'string') return notification.group;
    return this.groupsLoader.load(notification.group);
  }

  @ResolveField()
  async postOwner(@Root() notification: GroupPostNotification): Promise<User> {
    if (typeof notification.postOwner !== 'string') return notification.postOwner;
    return this.usersLoader.load(notification.postOwner);
  }
}
