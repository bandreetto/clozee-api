import faker from 'faker';
import { Trend } from '../../src/trends/contracts';

export const randomThreeTrends: Trend[] = [
  {
    id: 1,
    title: faker.company.bsNoun(),
    description: faker.company.bs(),
    createdAt: new Date(),
  },
  {
    id: 2,
    title: faker.company.bsNoun(),
    description: faker.company.bs(),
    createdAt: new Date(),
  },
  {
    id: 3,
    title: faker.company.bsNoun(),
    description: faker.company.bs(),
    createdAt: new Date(),
  },
];
