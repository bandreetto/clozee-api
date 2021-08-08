import { HttpService } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../../src/categories/categories.service';
import { ClockService } from '../../src/common/clock/clock.service';
import { PostsService } from '../../src/posts/posts.service';
import { UsersService } from '../../src/users/users.service';
import { HttpServiceMock } from '../mocks';
import { GivenCategories, givenCategoriesFactory } from './categories';
import { GivenCms, givenCmsFactory } from './cms';
import { GivenPosts, givenPostsFactory } from './posts';
import { GivenUsers, givenUsersFactory } from './users';

export interface Given {
  categories: GivenCategories;
  users: GivenUsers;
  posts: GivenPosts;
  cms: GivenCms;
}

export async function givenFactory(testingModule: TestingModule) {
  const categoriesService = await testingModule.resolve(CategoriesService);
  const givenCategories = givenCategoriesFactory(categoriesService);

  const usersService = await testingModule.resolve(UsersService);
  const jwtService = await testingModule.resolve(JwtService);
  const givenUsers = givenUsersFactory(usersService, jwtService);

  const postsService = await testingModule.resolve(PostsService);
  const givenPosts = givenPostsFactory(postsService, givenUsers, givenCategories);

  const httpServiceMock = (await testingModule.resolve(HttpService)) as HttpServiceMock;
  const clockService = await testingModule.resolve(ClockService);
  const givenCms = givenCmsFactory(httpServiceMock, clockService, givenPosts);

  return {
    categories: givenCategories,
    users: givenUsers,
    posts: givenPosts,
    cms: givenCms,
  };
}
