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

describe('Orders (e2e)', () => {
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
    // Wait for event loop to clear before exiting
    await new Promise(resolve => setInterval(resolve));
    await app.close();
    const connection = await moduleFixture.resolve<Connection>(getConnectionToken());
    connection.close(() => done());
  });

  it('should not allow to create a checkout link when post is sold', async () => {
    const [post] = await given.posts.somePostsSold(1);
    const checkoutLinkPost = gql`
      mutation CheckoutLink($postId: String!) {
        checkoutLink(postId: $postId)
      }
    `;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(checkoutLinkPost),
        variables: {
          postId: post._id,
        },
      })
      .expect(200)
      .then(response => {
        expect(response.body.errors[0].extensions.exception.status).toBe(409);
      });
  });
});
