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
import { HttpServiceMock, randomThreeTrends } from './mocks';

describe('Trends (e2e)', () => {
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

  it('should correctly fetch trends', async done => {
    const [trends, trendsUser] = await given.cms.withExistingTrends(randomThreeTrends);
    const expectedGQLResponse = {
      data: {
        trends: expect.arrayContaining(
          trends.map(trend => ({
            ...trend,
            createdAt: trend.createdAt.toISOString(),
            user: {
              username: trendsUser.username,
              avatar: trendsUser.avatar,
            },
          })),
        ),
      },
    };
    const trendsQuery = gql`
      {
        trends {
          id
          title
          description
          user {
            username
            avatar
          }
          createdAt
        }
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(trendsQuery),
      })
      .expect(200)
      .then(response => {
        expect(response.body).toEqual(expectedGQLResponse);
        return response;
      });

    done();
  });
});
