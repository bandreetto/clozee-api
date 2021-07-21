import * as dotenv from 'dotenv';
dotenv.config({
  path: '.e2e.env',
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { gql } from 'apollo-server-core';
import { print } from 'graphql';
import { CmsService } from '../src/cms/cms.service';
import { Post } from '../src/posts/contracts/index';
import { AppModule } from '../src/app.module';
import { Given, givenFactory } from './given';
import { getConnectionToken } from '@nestjs/mongoose';
import { flatten, omit } from 'ramda';
import { Connection } from 'mongoose';
import { PostsService } from '../src/posts/posts.service';
import { reconciliateByKey } from '../src/common/reconciliators';

describe('Explore (e2e)', () => {
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
    const connection = await moduleFixture.resolve(getConnectionToken());
    connection.close(() => done());
  });

  it('should return the list of upcoming events', async done => {
    const events = await given.cms.withUpcomingEventsRegistered();
    const postsService = await moduleFixture.resolve<PostsService>(PostsService);
    const posts = await Promise.all(
      events.map(async e => {
        const postIds = e.posts as string[];
        const foundPosts = await postsService.findManyByIds(postIds);
        return reconciliateByKey('_id', postIds, foundPosts);
      }),
    );
    const eventsAsGQLResponse = events.map((e, index) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      posts: posts[index].map(p => ({
        ...omit(['category', 'deleted', 'reportedBy', 'updatedAt', 'user', '__v'], p),
        createdAt: p.createdAt.toISOString(),
      })),
    }));
    const exploreEventsQuery = gql`
      {
        explore {
          events {
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
      }
    `;
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(exploreEventsQuery),
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual({ data: { explore: { events: eventsAsGQLResponse } } });
        return response;
      });

    done();
  });
});
