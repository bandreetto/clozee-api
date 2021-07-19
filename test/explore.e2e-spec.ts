import * as dotenv from 'dotenv';
dotenv.config({
  path: '.e2e.env',
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
import { Given, givenFactory } from './given';
import { getConnectionToken } from '@nestjs/mongoose';
import { async } from 'rxjs';

describe('Explore (e2e)', () => {
  let given: Given;
  let moduleFixture: TestingModule;
  let app: INestApplication;

  beforeAll(async done => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CmsService)
      .useValue({ getEvents: () => {} })
      .compile();
    given = await givenFactory(moduleFixture);
    app = moduleFixture.createNestApplication();
    await app.init();
    done();
  });

  beforeEach(async done => {
    const connection = await moduleFixture.resolve(getConnectionToken());
    await connection.dropDatabase();
    done();
  });

  afterAll(async done => {
    await app.close();
    const connection = await moduleFixture.resolve(getConnectionToken());
    await connection.close();
    done();
  });

  it('should return the list of upcoming events', async done => {
    const events = await given.cms.withUpcomingEventsRegistered();
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
              title
              images
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
        expect(response.body).toEqual({ explore: { events } });
        return response;
      });

    done();
  });
});
