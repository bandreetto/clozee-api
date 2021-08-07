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
import { PostsService } from '../src/posts/posts.service';
import { reconciliateByKey } from '../src/common/reconciliators';
import { omit } from 'ramda';
import { HttpServiceMock } from './mocks';
import { CmsService } from '../src/cms/cms.service';

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
    await app.close();
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    connection.close(() => done());
  });

  it('should be able to create a group and add posts to it', async done => {
    const [groupOwner, ...invitees] = await given.users.someUsersLoggedIn(3);
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
        accept: 'applicaiton/json',
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
});
