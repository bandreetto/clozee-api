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
import { FeedPostEdge } from '../src/feed/contracts';

describe('Feed (e2e)', () => {
  let given: Given;
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useClass(HttpServiceMock)
      .compile();
    given = await givenFactory(moduleFixture);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(done => {
    moduleFixture.resolve<Connection>(getConnectionToken()).then(connection => connection.db.dropDatabase(done));
  });

  afterEach(async () => {
    // Wait for event loop to clear before exiting
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await app.close();
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    await connection.close();
  });

  it('Should not return seen posts after opening new session', async () => {
    expect.assertions(3);
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
  });

  it('should make sure feed generation is random', async () => {
    expect.assertions(4);
    await given.posts.somePostsCreated(10);
    // Wait for all feed posts to be created
    await new Promise(resolve => setTimeout(resolve, 100));
    const [[_, token]] = await given.users.someUsersWithSessionStarted([randomUser()]);

    const feedQuery = gql`
      query {
        feed(first: 15) {
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

    let firstFeedPostIds: string[];
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
        expect(response?.body?.data?.feed?.edges?.length).toEqual(10);
        firstFeedPostIds = response.body.data.feed.edges.map((edge: FeedPostEdge) => edge.node._id);
      });

    // Mark all posts as seen
    await Promise.all(
      firstFeedPostIds.map(postId =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: print(markAsSeenMutation),
            variables: {
              postId,
            },
          })
          .set({
            authorization: `Bearer ${token}`,
          })
          .expect(200),
      ),
    );
    // wait for all posts to be marked as seen
    await new Promise(resolve => setTimeout(resolve, 100));
    // Initiate new session to blacklist seen posts
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: print(startSessionMutation) })
      .set({
        authorization: `Bearer ${token}`,
      })
      .expect(200);

    // make a second request to trigger empty feed event to recreate the feed
    await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: print(feedQuery) })
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then(response => {
        expect(response?.body?.data?.feed?.edges?.length).toEqual(0);
      });

    let secondFeedPostIds: string[];
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(feedQuery),
      })
      .set({ authorization: `Bearer ${token}` })
      .expect(200)
      .then(response => {
        expect(response?.body?.data?.feed?.edges?.length).toEqual(10);
        secondFeedPostIds = response.body.data.feed.edges.map((edge: FeedPostEdge) => edge.node._id);
      });
    expect(firstFeedPostIds).not.toEqual(secondFeedPostIds);
  });
});
