import { Injectable, HttpService, Logger, NotImplementedException } from '@nestjs/common';
import { ClozeeEvent } from '../clozee-events/contracts';
import configuration from '../config/configuration';
import { SearchCategory } from './contracts';
import { SearchCategoryDTO, CMSAuthResponse, EventDTO } from './contracts/dtos';

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

  async getEvents(range: { before?: Date; after?: Date }): Promise<ClozeeEvent[]> {
    await this.authPromise;
    const response = await this.httpService
      .get<EventDTO[]>(`${configuration.cms.url()}/events`, {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
        params: {
          ...(range.after ? { startAt_gte: range.after } : null),
          ...(range.before ? { startAt_lte: range.before } : null),
        },
      })
      .toPromise();
    return response.data.map(eventDTO => ({
      id: eventDTO.id,
      title: eventDTO.title,
      startAt: new Date(eventDTO.startAt),
      endAt: new Date(eventDTO.endAt),
      posts: eventDTO.posts.map(p => p.postId),
      bannerUrl: eventDTO.banner.url,
    }));
  }
}
