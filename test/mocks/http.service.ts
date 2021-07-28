import { HttpService } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { Observable } from 'rxjs';
import { sha1 } from 'hash.js';
import configuration from '../../src/config/configuration';

function hashParams(params: any): string {
  return sha1().update(JSON.stringify(params)).digest('hex');
}

export class HttpServiceMock extends HttpService {
  mocks = {
    post: {},
    get: {},
    cms: {
      token: 'token',
    },
  };

  constructor() {
    super();
    // Mocking CMS Authentication
    this.mockPost({ data: { jwt: this.mocks.cms.token } }, `${configuration.cms.url()}/auth/local`, {
      identifier: configuration.cms.identifier(),
      password: configuration.cms.password(),
    });
  }

  request<T = any>(_config: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    throw new Error('Method not implemented.');
  }

  mockGet(mock: any, url: string, config?: AxiosRequestConfig): void {
    const paramsHash = hashParams({ url, config });
    this.mocks.get[paramsHash] = mock;
  }
  get<T = any>(url: string, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const paramsHash = hashParams({ url, config });
    const response = this.mocks.get[paramsHash];
    if (!response) {
      throw new Error(`Could not find mock data for these parameters: ${JSON.stringify({ url, config })}`);
    }
    return new Observable(subscriber => {
      subscriber.next(response);
      subscriber.complete();
    });
  }

  delete<T = any>(_url: string, _config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    throw new Error('Method not implemented.');
  }
  head<T = any>(_url: string, _config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    throw new Error('Method not implemented.');
  }

  mockPost(mock: any, url: string, data?: any, config?: AxiosRequestConfig): void {
    const paramsHash = hashParams({ url, data, config });
    this.mocks.post[paramsHash] = mock;
  }
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    const paramsHash = hashParams({ url, data, config });
    const response = this.mocks.post[paramsHash];
    if (!response) {
      throw new Error(`Could not find mock data for these parameters: ${JSON.stringify({ url, data, config })}`);
    }
    return new Observable(subscriber => {
      subscriber.next(response);
      subscriber.complete();
    });
  }

  put<T = any>(_url: string, _data?: any, _config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    throw new Error('Method not implemented.');
  }
  patch<T = any>(_url: string, _data?: any, _config?: AxiosRequestConfig): Observable<AxiosResponse<T>> {
    throw new Error('Method not implemented.');
  }
  get axiosRef(): AxiosInstance {
    throw new Error('Method not implemented.');
  }
}
