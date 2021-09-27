import { Post } from '../../src/posts/contracts';
import { PostsService } from '../../src/posts/posts.service';
import { POST_CONDITIONS, SIZES } from '../../src/posts/contracts/enums';
import faker from 'faker';
import { GivenUsers } from './users';
import { GivenCategories } from './categories';
import { randomUser } from '../mocks';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface GivenPosts {
  somePostsCreated: (numberOfPosts: number) => Promise<Post[]>;
}

export function givenPostsFactory(
  postsService: PostsService,
  eventEmmiter: EventEmitter2,
  givenUsers: GivenUsers,
  givenCategories: GivenCategories,
): GivenPosts {
  async function somePostsCreated(numberOfPosts: number): Promise<Post[]> {
    const user = await givenUsers.oneUserSignedUp(randomUser());
    const category = await givenCategories.oneCategoryRegistered();
    const posts: Post[] = Array(numberOfPosts)
      .fill(null)
      .map(
        () =>
          ({
            _id: faker.datatype.uuid(),
            type: 'FeedPost',
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
    await Promise.all(
      createdPosts.map(async post => {
        await eventEmmiter.emitAsync('post.created', post);
        await eventEmmiter.emitAsync('feed-post.created', post);
      }),
    );
    return createdPosts;
  }
  return {
    somePostsCreated,
  };
}
