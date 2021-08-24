import { Post } from '../../src/posts/contracts';
import { PostsService } from '../../src/posts/posts.service';
import { POST_CONDITIONS, SIZES } from '../../src/posts/contracts/enums';
import faker from 'faker';
import { GivenUsers } from './users';
import { GivenCategories } from './categories';
import { randomUser } from '../mocks';

export interface GivenPosts {
  somePostsSavedCreated: (numberOfPosts: number) => Promise<Post[]>;
}

export function givenPostsFactory(
  postsService: PostsService,
  givenUsers: GivenUsers,
  givenCategories: GivenCategories,
): GivenPosts {
  async function somePostsSavedCreated(numberOfPosts: number): Promise<Post[]> {
    const user = await givenUsers.oneUserSignedUp(randomUser);
    const category = await givenCategories.oneCategoryRegistered();
    const posts: Post[] = Array(numberOfPosts)
      .fill(null)
      .map(
        () =>
          ({
            _id: faker.datatype.uuid(),
            user: user._id,
            title: faker.commerce.productName(),
            size: Object.values(SIZES)[Math.floor(Math.random() * Object.values(SIZES).length)],
            price: faker.datatype.number({ min: 700 }),
            images: [faker.image.imageUrl()],
            category: category._id,
            condition:
              Object.values(POST_CONDITIONS)[Math.floor(Math.random() * Object.values(POST_CONDITIONS).length)],
            description: faker.commerce.productDescription(),
          } as Post),
      );
    const createdPosts = await Promise.all(posts.map(p => postsService.create(p)));
    return createdPosts;
  }
  return {
    somePostsSavedCreated,
  };
}
