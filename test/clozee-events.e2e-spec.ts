import * as dotenv from 'dotenv';
dotenv.config({
  path: '.e2e.env',
});

import request from 'supertest';
import { print } from 'graphql';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { gql } from 'apollo-server-core';
import { AppModule } from '../src/app.module';
import { CmsService } from '../src/cms/cms.service';
import { Given, givenFactory } from './given';
import { Connection } from 'mongoose';
import { PostsService } from '../src/posts/posts.service';
import { reconciliateByKey } from '../src/common/reconciliators';
import { omit } from 'ramda';

describe('ClozeeEvents (e2e)', () => {
  let given: Given;
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async done => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CmsService)
      .useValue({ getEvents: () => {}, getEventById: () => {} })
      .compile();
    given = await givenFactory(moduleFixture);
    app = moduleFixture.createNestApplication();
    await app.init();
    done();
  });

  beforeEach(async done => {
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    connection.db.dropDatabase(() => done());
  });

  afterAll(async done => {
    await app.close();
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    connection.close(() => done());
  });

  it('should return an event by id', async done => {
    const events = await given.cms.withUpcomingEventsRegistered();
    const postsService = await moduleFixture.resolve<PostsService>(PostsService);
    const posts = await postsService.findManyByIds(events[0].posts as string[]);
    const eventAsGQLResponse = {
      ...events[0],
      startAt: events[0].startAt.toISOString(),
      endAt: events[0].endAt.toISOString(),
      posts: reconciliateByKey('_id', events[0].posts as string[], posts).map(p => ({
        ...omit(['category', 'deleted', 'reportedBy', 'updatedAt', 'user', '__v'], p),
        createdAt: p.createdAt.toISOString(),
      })),
    };
    const getEventQuery = gql`
      {
        event(id: ${events[0].id}) {
          id
          title
          bannerUrl
          startAt
          endAt
          posts {
              _id
              condition
              createdAt
              description
              price
              size
              title
              images
              donationPercentage
          }
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(getEventQuery),
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual({ data: { event: eventAsGQLResponse } });
        return response;
      });

    done();
  });
});
