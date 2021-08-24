import { Trend } from 'src/trends/contracts';
import { TrendDTO } from './contracts';

export function fromTrendDTOtoTrend(trendDTO: TrendDTO): Trend {
  return {
    id: trendDTO.id,
    title: trendDTO.title,
    description: trendDTO.description,
    createdAt: new Date(trendDTO.created_at),
  };
}
