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
import { HttpServiceMock } from './mocks';
import { randomOrder, randomTransaction } from './mocks/payments.dtos';
import faker from 'faker';
import { Address } from '../src/users/contracts';
import { MenvService } from '../src/delivery/menv.service';

describe('Pagarme Postbacks (e2e)', () => {
  let given: Given;
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async done => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useClass(HttpServiceMock)
      .overrideProvider(MenvService)
      .useValue({ calculateDelivery: () => ({ price: 500, deliveryTime: 5, id: 1 }) })
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

  it('Should correctly create order and sales after successful postback', async () => {
    const [post] = await given.posts.somePostsCreated(1);
    const email = faker.internet.email();
    const name = faker.name.findName();
    const phoneNumber = faker.phone.phoneNumber();
    const address: Address = {
      city: faker.address.city(),
      state: faker.address.state(),
      number: faker.datatype.number(),
      street: faker.address.streetName(),
      zipCode: faker.address.zipCode(),
      district: faker.address.county(),
      complement: faker.lorem.word(),
    };
    const pagarmeOrder = randomOrder(post);
    const pagarmeTransaction = randomTransaction(email, name, phoneNumber, address, pagarmeOrder.id);
    const postQuery = gql`
      query Post($id: String!) {
        post(postId: $id) {
          _id
          sold
        }
      }
    `;

    await request(app.getHttpServer()).post('/pagarme-postbacks/orders').send({ order: pagarmeOrder }).expect(201);
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(postQuery),
        variables: {
          id: post._id,
        },
      })
      .expect(200)
      .then(response => {
        expect(response?.body?.data?.post).toEqual({
          _id: post._id,
          sold: false,
        });
      });
    await request(app.getHttpServer())
      .post('/pagarme-postbacks/transactions')
      .send({ transaction: pagarmeTransaction })
      .expect(201);
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: print(postQuery),
        variables: {
          id: post._id,
        },
      })
      .expect(200)
      .then(response => {
        expect(response?.body?.data?.post).toEqual({
          _id: post._id,
          sold: true,
        });
      });
  });
});
