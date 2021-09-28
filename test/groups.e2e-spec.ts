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
import configuration from '../src/config/configuration';
import { times } from 'ramda';

describe('Groups (e2e)', () => {
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

  it('should be able to create a group', async done => {
    const [groupOwner, ...invitees] = await given.users.someUsersLoggedIn(times(randomUser, 3));
    const GROUP_NAME = 'Test Group';
    const expectedGQLResponse = {
      data: {
        createGroup: {
          name: GROUP_NAME,
          participants: [groupOwner, ...invitees].map(([user]) => ({
            _id: user._id,
          })),
        },
      },
    };
    const createGroupMutation = gql`
      mutation CreateGroup($groupName: String!, $participants: [String!]!) {
        createGroup(name: $groupName, participants: $participants) {
          _id
          name
          participants {
            _id
          }
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(createGroupMutation),
        variables: {
          groupName: GROUP_NAME,
          participants: invitees.map(([invitee]) => invitee._id),
        },
      })
      .set({
        authorization: `Bearer ${groupOwner[1]}`,
      })
      .expect(200)
      .then(response => {
        expect(typeof response.body.data.createGroup._id).toBe('string');
        delete response.body.data.createGroup._id;
        expect(response.body).toEqual(expectedGQLResponse);
        return response;
      });

    done();
  });

  it('should be able to add a post to an existing group', async done => {
    const { group, loggedParticipants } = await given.groups.oneGroupCreated();
    const imageId = 'id1';
    const post = {
      title: 'title',
      description: 'description',
    };
    const expectedGQLResponse = {
      data: {
        addPostToGroup: {
          _id: group._id,
          name: group.name,
          participants: loggedParticipants.map(([user]) => ({
            _id: user._id,
          })),
          posts: [
            {
              ...post,
              images: [`https://${configuration.images.cdn()}/posts/${imageId}.jpg`],
            },
          ],
        },
      },
    };
    const addGroupPostMutation = gql`
      mutation AddGroupPost($groupId: String!, $post: AddGroupPostInput!) {
        addPostToGroup(groupId: $groupId, post: $post) {
          _id
          name
          participants {
            _id
          }
          posts {
            _id
            title
            description
            images
          }
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(addGroupPostMutation),
        variables: {
          groupId: group._id,
          post: {
            ...post,
            imagesIds: [imageId],
          },
        },
      })
      .set({
        authorization: `Bearer ${loggedParticipants[0][1]}`,
      })
      .expect(200)
      .then(response => {
        expect(typeof response.body.data.addPostToGroup.posts[0]._id).toBe('string');
        delete response.body.data.addPostToGroup.posts[0]._id;
        expect(response.body).toEqual(expectedGQLResponse);
      });
    done();
  });

  it('should be able to return groups that is participating', async () => {
    const { group, loggedParticipants } = await given.groups.oneGroupCreated();

    const expectedGQLResponse = {
      data: {
        groups: [
          {
            ...group,
            participants: loggedParticipants.map(([participant]) => ({
              _id: participant._id,
            })),
          },
        ],
      },
    };

    const groupsQuery = gql`
      {
        groups {
          _id
          name
          participants {
            _id
          }
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(groupsQuery),
      })
      .set({
        authorization: `Bearer ${loggedParticipants[0][1]}`,
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual(expectedGQLResponse);
        return response;
      });
  });
});
