import { Injectable, HttpService, Logger } from '@nestjs/common';
import configuration from 'src/config/configuration';
import { SearchCategory } from './contracts';
import { SearchCategoryDTO, CMSAuthResponse } from './contracts/dtos';
import { AxiosResponse } from 'axios';

@Injectable()
export class CmsService {
  private logger = new Logger(CmsService.name);
  private authPromise: Promise<void>;
  private token: string;

  constructor(private readonly httpService: HttpService) {
    this.authPromise = httpService
      .post<CMSAuthResponse>(`${configuration.cms.url()}/auth/local`, {
        identifier: configuration.cms.identifier(),
        password: configuration.cms.password(),
      })
      .toPromise()
      .then(response => {
        this.token = response.data.jwt;
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

    return response.data.map(searchCategory => ({
      id: searchCategory.id,
      title: searchCategory.title,
      imageUrl: searchCategory.image.url,
      searchTerm: searchCategory.searchTerm,
    }));
  }
}
