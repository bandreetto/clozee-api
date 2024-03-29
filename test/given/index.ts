import { HttpService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { CategoriesService } from '../../src/categories/categories.service';
import { ClockService } from '../../src/common/clock/clock.service';
import { CountersService } from '../../src/counters/counters.service';
import { GroupsService } from '../../src/groups/groups.service';
import { OrdersService } from '../../src/orders/orders.service';
import { PostsService } from '../../src/posts/posts.service';
import { SessionsService } from '../../src/sessions/sessions.service';
import { UsersService } from '../../src/users/users.service';
import { HttpServiceMock } from '../mocks';
import { GivenCategories, givenCategoriesFactory } from './categories';
import { GivenCms, givenCmsFactory } from './cms';
import { GivenGroups, givenGroupsFactory } from './groups';
import { GivenPosts, givenPostsFactory } from './posts';
import { GivenUsers, givenUsersFactory } from './users';

export interface Given {
  categories: GivenCategories;
  users: GivenUsers;
  posts: GivenPosts;
  cms: GivenCms;
  groups: GivenGroups;
}

export async function givenFactory(testingModule: TestingModule) {
  const categoriesService = await testingModule.resolve(CategoriesService);
  const givenCategories = givenCategoriesFactory(categoriesService);

  const usersService = await testingModule.resolve(UsersService);
  const jwtService = await testingModule.resolve(JwtService);
  const sessionsService = await testingModule.resolve(SessionsService);
  const eventEmitter = await testingModule.resolve(EventEmitter2);
  const givenUsers = givenUsersFactory(usersService, jwtService, sessionsService, eventEmitter);

  const groupsService = await testingModule.resolve(GroupsService);
  const givenGroups = givenGroupsFactory(givenUsers, groupsService);

  const postsService = await testingModule.resolve(PostsService);
  const ordersService = await testingModule.resolve(OrdersService);
  const countersService = await testingModule.resolve(CountersService);
  const givenPosts = givenPostsFactory(
    postsService,
    ordersService,
    countersService,
    usersService,
    eventEmitter,
    givenUsers,
    givenCategories,
  );

  const httpServiceMock = (await testingModule.resolve(HttpService)) as HttpServiceMock;
  const clockService = await testingModule.resolve(ClockService);
  const givenCms = givenCmsFactory(httpServiceMock, clockService, givenPosts, givenUsers);

  return {
    categories: givenCategories,
    users: givenUsers,
    posts: givenPosts,
    cms: givenCms,
    groups: givenGroups,
  };
}
