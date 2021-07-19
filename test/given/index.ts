import { TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../../src/categories/categories.service';
import { CmsService } from '../../src/cms/cms.service';
import { PostsService } from '../../src/posts/posts.service';
import { UsersService } from '../../src/users/users.service';
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
  const givenUsers = givenUsersFactory(usersService);

  const postsService = await testingModule.resolve(PostsService);
  const givenPosts = givenPostsFactory(postsService, givenUsers, givenCategories);

  const cmsService = await testingModule.resolve(CmsService);
  const givenCms = givenCmsFactory(cmsService, givenPosts);

  return {
    categories: givenCategories,
    users: givenUsers,
    posts: givenPosts,
    cms: givenCms,
  };
}
