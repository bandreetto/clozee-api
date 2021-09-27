import faker from 'faker';
import { GivenPosts } from './posts';
import dayjs from 'dayjs';
import { HttpServiceMock } from '../mocks';
import { EventDTO, TrendDTO } from '../../src/cms/contracts';
import { Trend } from '../../src/trends/contracts';
import configuration from '../../src/config/configuration';
import { ClockService } from '../../src/common/clock/clock.service';
import { GivenUsers } from './users';
import { clozeeTrendsUser } from '../mocks/users';
import { User } from '../../src/users/contracts';
import { descend, sort } from 'ramda';

export interface GivenCms {
  withUpcomingEventsRegistered: () => Promise<EventDTO[]>;
  withExistingTrends: (trends: Trend[]) => Promise<[trends: Trend[], trendsUser: User]>;
}

export function givenCmsFactory(
  httpService: HttpServiceMock,
  clockService: ClockService,
  givenPosts: GivenPosts,
  givenUsers: GivenUsers,
): GivenCms {
  async function withUpcomingEventsRegistered(): Promise<EventDTO[]> {
    const createdPosts = await givenPosts.somePostsCreated(3);
    const baseId = faker.datatype.number(100);
    const now = clockService.now();
    const events: EventDTO[] = [
      {
        id: baseId,
        posts: createdPosts.map((p, index) => ({ id: index, postId: p._id })),
        title: 'Feira que já terminou',
        startAt: dayjs(now).subtract(4, 'hours').toISOString(),
        endAt: dayjs(now).subtract(2, 'hours').toISOString(),
        banner: {
          id: faker.datatype.number(),
          ext: '.png',
          url: faker.image.imageUrl(),
          hash: faker.datatype.uuid(),
          mime: 'image/png',
          name: faker.commerce.product(),
          size: faker.datatype.number(),
          width: faker.datatype.number(),
          height: faker.datatype.number(),
          caption: faker.commerce.product(),
          formats: {
            thumbnail: {
              ext: '.png',
              url: faker.image.imageUrl(),
              height: faker.datatype.number(),
              width: faker.datatype.number(),
              size: faker.datatype.number(),
              name: faker.commerce.product(),
              mime: 'image/png',
              hash: faker.datatype.uuid(),
            },
          },
          provider: faker.datatype.string(),
          created_at: faker.date.past().toISOString(),
          updated_at: faker.date.past().toISOString(),
          alternativeText: faker.commerce.product(),
        },
        updated_at: faker.date.past().toISOString(),
        created_at: faker.date.past().toISOString(),
        published_at: faker.date.past().toISOString(),
      },
      {
        id: baseId + 1,
        posts: createdPosts.map((p, index) => ({ id: index, postId: p._id })),
        title: 'Feira que começou',
        startAt: dayjs(now).subtract(2, 'hours').toISOString(),
        endAt: dayjs(now).add(2, 'hours').toISOString(),
        banner: {
          id: faker.datatype.number(),
          ext: '.png',
          url: faker.image.imageUrl(),
          hash: faker.datatype.uuid(),
          mime: 'image/png',
          name: faker.commerce.product(),
          size: faker.datatype.number(),
          width: faker.datatype.number(),
          height: faker.datatype.number(),
          caption: faker.commerce.product(),
          formats: {
            thumbnail: {
              ext: '.png',
              url: faker.image.imageUrl(),
              height: faker.datatype.number(),
              width: faker.datatype.number(),
              size: faker.datatype.number(),
              name: faker.commerce.product(),
              mime: 'image/png',
              hash: faker.datatype.uuid(),
            },
          },
          provider: faker.datatype.string(),
          created_at: faker.date.past().toISOString(),
          updated_at: faker.date.past().toISOString(),
          alternativeText: faker.commerce.product(),
        },
        updated_at: faker.date.past().toISOString(),
        created_at: faker.date.past().toISOString(),
        published_at: faker.date.past().toISOString(),
      },
      {
        id: baseId + 2,
        posts: createdPosts.map((p, index) => ({ id: index, postId: p._id })),
        title: 'Feira que vai começar',
        startAt: dayjs(now).add(2, 'hours').toISOString(),
        endAt: dayjs(now).add(4, 'hours').toISOString(),
        banner: {
          id: faker.datatype.number(),
          ext: '.png',
          url: faker.image.imageUrl(),
          hash: faker.datatype.uuid(),
          mime: 'image/png',
          name: faker.commerce.product(),
          size: faker.datatype.number(),
          width: faker.datatype.number(),
          height: faker.datatype.number(),
          caption: faker.commerce.product(),
          formats: {
            thumbnail: {
              ext: '.png',
              url: faker.image.imageUrl(),
              height: faker.datatype.number(),
              width: faker.datatype.number(),
              size: faker.datatype.number(),
              name: faker.commerce.product(),
              mime: 'image/png',
              hash: faker.datatype.uuid(),
            },
          },
          provider: faker.datatype.string(),
          created_at: faker.date.past().toISOString(),
          updated_at: faker.date.past().toISOString(),
          alternativeText: faker.commerce.product(),
        },
        updated_at: faker.date.past().toISOString(),
        created_at: faker.date.past().toISOString(),
        published_at: faker.date.past().toISOString(),
      },
    ];

    httpService.mockGet(
      {
        data: events,
      },
      `${configuration.cms.url()}/events`,
      {
        headers: {
          authorization: `Bearer ${httpService.mocks.cms.token}`,
        },
        params: {
          endAt_gte: now,
        },
      },
    );
    httpService.mockGet(
      {
        data: events[0],
      },
      `${configuration.cms.url()}/events/${events[0].id}`,
      {
        headers: {
          authorization: `Bearer ${httpService.mocks.cms.token}`,
        },
      },
    );
    httpService.mockGet(
      {
        data: events[1],
      },
      `${configuration.cms.url()}/events/${events[1].id}`,
      {
        headers: {
          authorization: `Bearer ${httpService.mocks.cms.token}`,
        },
      },
    );
    httpService.mockGet(
      {
        data: events[2],
      },
      `${configuration.cms.url()}/events/${events[2].id}`,
      {
        headers: {
          authorization: `Bearer ${httpService.mocks.cms.token}`,
        },
      },
    );

    return events;
  }

  async function withExistingTrends(trends: Trend[]): Promise<[trends: Trend[], trendUser: User]> {
    const trendsUser = await givenUsers.oneUserSignedUp(clozeeTrendsUser());
    const trendsDTO: TrendDTO[] = trends.map(trend => ({
      ...trend,
      created_at: trend.createdAt.toISOString(),
      updated_at: trend.createdAt.toISOString(),
      published_at: trend.createdAt.toISOString(),
      user: trendsUser._id,
    }));

    httpService.mockGet(
      {
        data: sort(
          descend(trend => trend.created_at),
          trendsDTO,
        ),
      },
      `${configuration.cms.url()}/trends`,
      {
        headers: {
          authorization: `Bearer ${httpService.mocks.cms.token}`,
        },
        params: {
          _sort: 'created_at:desc',
        },
      },
    );
    const trendsWithUser = trends.map(trend => ({
      ...trend,
      user: trendsUser._id,
    }));
    return [trendsWithUser, trendsUser];
  }
  return {
    withUpcomingEventsRegistered,
    withExistingTrends,
  };
}
