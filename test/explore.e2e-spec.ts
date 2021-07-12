import * as dotenv from 'dotenv';
dotenv.config({
  path: '.env.e2e',
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { gql } from 'apollo-server-core';
import { print } from 'graphql';
import { ClozeeEvent } from '../src/clozee-events/contracts';
import { CmsService } from '../src/cms/cms.service';
import { Post } from '../src/posts/contracts/index';
import { POST_CONDITIONS, SIZES } from '../src/posts/contracts/enums';
import faker from 'faker';
import dayjs from 'dayjs';
import { AppModule } from '../src/app.module';

describe('Explore (e2e)', () => {
  let app: INestApplication;
  const cmsServiceMock: Pick<CmsService, 'getEvents'> = {
    async getEvents(range: { before: Date; after: Date }): Promise<ClozeeEvent[]> {
      const startAt = faker.date.between(range.after, range.before);
      return [
        {
          id: faker.datatype.number(),
          title: faker.lorem.sentence(),
          bannerUrl: faker.image.imageUrl(),
          startAt,
          endAt: dayjs(startAt).add(4, 'hours').toDate(),
          posts: [
            {
              _id: faker.datatype.uuid(),
              title: faker.image.fashion(),
              size: SIZES.P,
              user: faker.datatype.uuid(),
              price: faker.datatype.number({
                min: 700,
              }),
              images: [faker.image.imageUrl()],
              category: faker.datatype.uuid(),
              condition: POST_CONDITIONS.NEW,
              description: faker.lorem.sentence(),
              donationPercentage: faker.datatype.number(100),
              createdAt: faker.date.past(),
            },
          ] as Post[],
        },
      ] as ClozeeEvent[];
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CmsService)
      .useValue(cmsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it.only('should return the list of upcoming events', () => {
    const exploreEventsQuery = gql`
      explore {
        events {
          id
          title
          bannerUrl
          startAt
          endAt
          posts {
            _id
            title
            imageUrl
          }
        }
      }
    `;

    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(exploreEventsQuery),
      })
      .expect(200)
      .expect('Hello World!');
  });
});
