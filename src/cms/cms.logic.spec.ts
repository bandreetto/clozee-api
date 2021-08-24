import faker from 'faker';
import { fromTrendDTOtoTrend } from './cms.logic';
import { TrendDTO } from './contracts';

describe('TrendsLogic', () => {
  it('should correctly adapt from TrendDTO to Trend', () => {
    const trendDTO: TrendDTO = {
      id: 1,
      title: faker.company.bsNoun(),
      description: faker.company.bs(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };
    const adaptedTrend = fromTrendDTOtoTrend(trendDTO);
    const expectedTrend = {
      id: 1,
      title: trendDTO.title,
      description: trendDTO.description,
      createdAt: new Date(trendDTO.created_at),
    };
    expect(adaptedTrend).toEqual(expectedTrend);
  });
});
