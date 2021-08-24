import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Trend } from 'src/trends/contracts';
import { ClozeeEvent } from '../clozee-events/contracts';
import configuration from '../config/configuration';
import { fromTrendDTOtoTrend } from './cms.logic';
import { SearchCategory } from './contracts';
import { CMSAuthResponse, EventDTO, SearchCategoryDTO, TrendDTO } from './contracts/dtos';

@Injectable()
export class CmsService {
  private logger = new Logger(CmsService.name);
  private authPromise: Promise<void>;
  private token: string;

  constructor(private readonly httpService: HttpService) {
    this.logger.log('Authenticating with CMS Service');
    this.authPromise = httpService
      .post<CMSAuthResponse>(`${configuration.cms.url()}/auth/local`, {
        identifier: configuration.cms.identifier(),
        password: configuration.cms.password(),
      })
      .toPromise()
      .then(response => {
        this.token = response.data.jwt;
        this.logger.log('Authentication with CMS Service succeeded!');
      })
      .catch(error => {
        this.logger.error({
          message: 'Could not authenticate with CMS Service.',
          error: error.toString(),
          metadata: error,
        });
      });
  }

  async getSearchCategories(): Promise<SearchCategory[]> {
    await this.authPromise;
    const response = await this.httpService
      .get<SearchCategoryDTO[]>(`${configuration.cms.url()}/search-categories`, {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();

    return response.data.map(searchCategory => {
      let imageUrl = searchCategory.image?.url;
      if (!imageUrl) {
        imageUrl = '';
        this.logger.warn(`Could not find image for category ${searchCategory.id}`);
      } else imageUrl = `${configuration.cms.cdn()}/${searchCategory.image.hash}${searchCategory.image.ext}`;
      return {
        id: searchCategory.id,
        title: searchCategory.title,
        imageUrl,
        searchTerm: searchCategory.searchTerm,
      };
    });
  }

  async getEvents(range: {
    startBefore?: Date;
    startAfter?: Date;
    endBefore?: Date;
    endAfter?: Date;
  }): Promise<ClozeeEvent[]> {
    await this.authPromise;
    const response = await this.httpService
      .get<EventDTO[]>(`${configuration.cms.url()}/events`, {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
        params: {
          ...(range.startAfter ? { startAt_gte: range.startAfter } : null),
          ...(range.startBefore ? { startAt_lte: range.startBefore } : null),
          ...(range.endAfter ? { endAt_gte: range.endAfter } : null),
          ...(range.endBefore ? { endAt_lte: range.endBefore } : null),
        },
      })
      .toPromise();
    return response.data.map(eventDTO => {
      let bannerUrl = eventDTO.banner?.url;
      if (!bannerUrl) {
        bannerUrl = '';
        this.logger.warn(`Could not find image for clozee-event ${eventDTO.id}`);
      } else bannerUrl = `${configuration.cms.cdn()}/${eventDTO.banner.hash}${eventDTO.banner.ext}`;

      return {
        id: eventDTO.id,
        title: eventDTO.title,
        startAt: new Date(eventDTO.startAt),
        endAt: new Date(eventDTO.endAt),
        posts: eventDTO.posts.map(p => p.postId),
        bannerUrl,
      };
    });
  }

  async getEventById(eventId: number): Promise<ClozeeEvent> {
    await this.authPromise;
    const { data: eventDTO } = await this.httpService
      .get<EventDTO>(`${configuration.cms.url()}/events/${eventId}`, {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();

    let bannerUrl = eventDTO.banner?.url;
    if (!bannerUrl) {
      bannerUrl = '';
      this.logger.warn(`Could not find image for clozee-event ${eventDTO.id}`);
    } else bannerUrl = `${configuration.cms.cdn()}/${eventDTO.banner.hash}${eventDTO.banner.ext}`;

    return {
      id: eventDTO.id,
      title: eventDTO.title,
      startAt: new Date(eventDTO.startAt),
      endAt: new Date(eventDTO.endAt),
      posts: eventDTO.posts.map(p => p.postId),
      bannerUrl,
    };
  }

  async getTrends(): Promise<Trend[]> {
    await this.authPromise;
    const { data: trendsDTO } = await this.httpService
      .get<TrendDTO[]>(`${configuration.cms.url()}/trends`, {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();
    return trendsDTO.map(fromTrendDTOtoTrend);
  }
}
