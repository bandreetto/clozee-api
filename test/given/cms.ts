import faker from 'faker';
import { CmsService } from '../../src/cms/cms.service';
import { ClozeeEvent } from '../../src/clozee-events/contracts';
import { GivenPosts } from './posts';
import dayjs from 'dayjs';

export interface GivenCms {
  withUpcomingEventsRegistered: () => Promise<ClozeeEvent[]>;
}

export function givenCmsFactory(cmsService: CmsService, givenPosts: GivenPosts): GivenCms {
  async function withUpcomingEventsRegistered(): Promise<ClozeeEvent[]> {
    const createdPosts = await givenPosts.somePostsSavedCreated(3);
    const baseId = faker.datatype.number(100);
    const events: ClozeeEvent[] = [
      {
        id: baseId,
        posts: createdPosts,
        title: 'Feira que já terminou',
        startAt: dayjs().subtract(4, 'hours').toDate(),
        endAt: dayjs().subtract(2, 'hours').toDate(),
        bannerUrl: 'https://placekitten.com/500/200',
      },
      {
        id: baseId + 1,
        posts: createdPosts,
        title: 'Feira que começou',
        startAt: dayjs().subtract(2, 'hours').toDate(),
        endAt: dayjs().add(2, 'hours').toDate(),
        bannerUrl: 'https://placekitten.com/500/200',
      },
      {
        id: baseId + 2,
        posts: createdPosts,
        title: 'Feira que vai começar',
        startAt: dayjs().add(2, 'hours').toDate(),
        endAt: dayjs().add(4, 'hours').toDate(),
        bannerUrl: 'https://placekitten.com/500/200',
      },
    ];

    jest.spyOn(cmsService, 'getEvents').mockImplementation(async () => events);

    return events;
  }

  return {
    withUpcomingEventsRegistered,
  };
}
