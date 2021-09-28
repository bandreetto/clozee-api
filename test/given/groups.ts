import faker from 'faker';
import { times } from 'ramda';
import { v4 } from 'uuid';
import { Group, GroupParticipant } from '../../src/groups/contracts';
import { GroupsService } from '../../src/groups/groups.service';
import { User } from '../../src/users/contracts';
import { randomUser } from '../mocks';
import { GivenUsers } from './users';

export interface GivenGroups {
  oneGroupCreated: () => Promise<{ group: Group; loggedParticipants: [user: User, token: string][] }>;
}

export function givenGroupsFactory(givenUsers: GivenUsers, groupsService: GroupsService): GivenGroups {
  async function oneGroupCreated(): Promise<{ group: Group; loggedParticipants: [user: User, token: string][] }> {
    const usersAndTokens = await givenUsers.someUsersLoggedIn(times(randomUser, 3));
    const group: Group = {
      _id: v4(),
      name: faker.lorem.word(),
    };

    const participants: GroupParticipant[] = usersAndTokens.map(([user]) => ({
      _id: v4(),
      group: group._id,
      user: user._id,
    }));

    await groupsService.createGroup(group);
    await groupsService.createGroupParticipants(participants);

    return {
      group,
      loggedParticipants: usersAndTokens,
    };
  }

  return {
    oneGroupCreated,
  };
}
