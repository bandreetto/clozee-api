import * as dotenv from 'dotenv';

dotenv.config({
  path: '.e2e.env',
});

import { Test, TestingModule } from '@nestjs/testing';
import { HttpService, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { gql } from 'apollo-server-core';
import { print } from 'graphql';
import { AppModule } from '../src/app.module';
import { Given, givenFactory } from './given';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { HttpServiceMock, randomUser } from './mocks';

describe('Feed (e2e)', () => {
  let given: Given;
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async done => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useClass(HttpServiceMock)
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
    // Wait for event loopt to clear before exiting
    await new Promise(resolve => setInterval(resolve));
    await app.close();
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    connection.close(() => done());
  });

  it('Should not return seen posts after opening new session', async done => {
    const [seenPost, ...rest] = await given.posts.somePostsCreated(5);
    // wait until macrotask queue is empty to continue
    await new Promise(resolve => setImmediate(resolve));
    const [[_, token]] = await given.users.someUsersWithSessionStarted([randomUser()]);

    const firstFeedExpectedResponse = {
      data: {
        feed: {
          edges: expect.arrayContaining(
            [seenPost, ...rest].map(post => ({
              node: {
                _id: post._id,
              },
            })),
          ),
        },
      },
    };
    const secondFeedExpectedResponse = {
      data: {
        feed: {
          edges: expect.arrayContaining(
            rest.map(post => ({
              node: {
                _id: post._id,
              },
            })),
          ),
        },
      },
    };
    const feedQuery = gql`
      query {
        feed(first: 5) {
          edges {
            node {
              _id
            }
          }
        }
      }
    `;
    const markAsSeenMutation = gql`
      mutation MarkAsSeen($postId: String!) {
        markPostAsSeen(post: $postId)
      }
    `;
    const startSessionMutation = gql`
      mutation {
        startSession {
          _id
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(feedQuery),
      })
      .set({
        authorization: `Bearer ${token}`,
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual(firstFeedExpectedResponse);
        return response;
      });

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(markAsSeenMutation),
        variables: {
          postId: seenPost._id,
        },
      })
      .set({
        authorization: `Bearer ${token}`,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(startSessionMutation),
      })
      .set({
        authorization: `Bearer ${token}`,
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(feedQuery),
      })
      .set({
        authorization: `Bearer ${token}`,
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual(secondFeedExpectedResponse);
        expect(response.body.data.feed.edges).not.toContain({
          node: {
            _id: seenPost._id,
          },
        });
        return response;
      });

    done();
  });
});
