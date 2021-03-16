import { HttpService, Injectable, Logger } from '@nestjs/common';
import { ascend } from 'ramda';
import configuration from 'src/config/configuration';
import { Post } from 'src/posts/contracts';
import { User } from 'src/users/contracts';
import {
  MenvAddToCartResponse,
  MenvCalculateResponse,
  MenvCheckoutResponse,
} from './contracts/dtos';

const formatZipCode = (zipCode: string) => {
  return zipCode.replace(/\s/g, '').replace('-', '');
};

const fromPriceToNumber = (price: string) => {
  return Number(price.replace('.', ''));
};

@Injectable()
export class MenvService {
  private logger = new Logger(MenvService.name);

  constructor(private readonly httpClient: HttpService) {}

  private requestConfig = {
    headers: {
      Authorization: `Bearer ${configuration.menv.token()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': `${configuration.menv.contactMail()}`,
    },
  };

  async calculateDelivery(
    originZipCode: string,
    destinationZipCode: string,
  ): Promise<{ price: number; deliveryTime: number; id: number }> {
    if (!originZipCode || !destinationZipCode) {
      throw new Error(
        'Origin and destination zipCodes required to calculate delivery',
      );
    }

    try {
      const response = await this.httpClient
        .post<MenvCalculateResponse[]>(
          `${configuration.menv.apiUrl()}/me/shipment/calculate`,
          {
            from: {
              postal_code: formatZipCode(originZipCode),
            },
            to: {
              postal_code: formatZipCode(destinationZipCode),
            },
            package: {
              height: 30,
              width: 30,
              length: 30,
              weight: 1,
            },
          },
          this.requestConfig,
        )
        .toPromise();

      const deliveryOptions = response.data.filter(o => !!o.price);

      if (!deliveryOptions || deliveryOptions.length === 0) {
        throw new Error('No delivery options');
      }

      const cheapestDeliveryOption = deliveryOptions.sort(
        ascend<MenvCalculateResponse>(option =>
          fromPriceToNumber(option.price),
        ),
      )[0];

      return {
        price: fromPriceToNumber(cheapestDeliveryOption.price),
        deliveryTime: cheapestDeliveryOption.delivery_time,
        id: cheapestDeliveryOption.id,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error while calculating delivery fee',
        error,
        originZipCode,
        destinationZipCode,
      });
      throw new Error('Internal error');
    }
  }

  async addToCart(
    serviceNumber: number,
    sender: User,
    adressee: User,
    posts: Post[],
    orderNumber: number,
  ): Promise<{ orderId: string }> {
    if (!serviceNumber) {
      throw new Error('Service number not provided');
    }

    if (!sender || !adressee) {
      throw new Error('Sender and adressee required to calculate delivery');
    }

    if (!posts || posts.length === 0) {
      throw new Error('Posts must be provided to checkout delivery');
    }

    const data = {
      service: serviceNumber,
      from: {
        name: sender.name,
        phone: sender.phoneNumber,
        email: sender.email,
        document: sender.cpf,
        address: sender.address.street,
        complement: sender.address.complement,
        number: sender.address.number,
        district: sender.address.district,
        city: sender.address.city,
        country_id: 'BR',
        postal_code: formatZipCode(sender.address.zipCode),
        note: '',
      },
      to: {
        name: adressee.name,
        phone: adressee.phoneNumber,
        email: adressee.email,
        document: adressee.cpf,
        address: adressee.address.street,
        complement: adressee.address.complement,
        number: adressee.address.number,
        district: adressee.address.district,
        city: adressee.address.city,
        state_abbr: adressee.address.state,
        country_id: 'BR',
        postal_code: formatZipCode(adressee.address.zipCode),
        note: '',
      },
      products: posts.map(post => ({
        name: post.title,
        quantity: 1,
        unitary_value: post.price / 100,
      })),
      volumes: [
        {
          height: 30,
          width: 30,
          length: 30,
          weight: 1,
        },
      ],
      options: {
        insurance_value: posts.reduce((acc, post) => acc + post.price, 0) / 100,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: false,
        platform: 'Clozee',
        tags: [
          {
            tag: `Número do pedido: ${orderNumber}`,
            url: null,
          },
        ],
      },
    };

    try {
      const response = await this.httpClient
        .post<MenvAddToCartResponse>(
          `${configuration.menv.apiUrl()}/me/cart`,
          data,
          this.requestConfig,
        )
        .toPromise();

      return { orderId: response.data.id };
    } catch (error) {
      this.logger.error({
        message: 'Error while trying to add delivery to cart',
        error,
      });
      return { orderId: null };
    }
  }

  async checkout(orders: string[]): Promise<{ id: string; total: number }> {
    if (!orders || orders.length === 0) {
      throw new Error('Please, provide the orders to checkout delivery');
    }

    try {
      const response = await this.httpClient
        .post<MenvCheckoutResponse>(
          `${configuration.menv.apiUrl()}/me/shipment/checkout`,
          {
            orders,
          },
          this.requestConfig,
        )
        .toPromise();

      const purchase = response.data.purchase;

      if (!purchase) {
        throw new Error('No purchase on checkout response');
      }

      return { id: purchase.id, total: purchase.total };
    } catch (error) {
      this.logger.error({
        message: 'Error while checking out delivery',
        error,
        orders,
      });
      return null;
    }
  }

  async generateLabels(orders: string[]): Promise<{ success: boolean }> {
    if (!orders || orders.length === 0) {
      throw new Error('Please, provide the orders to generate labels');
    }

    try {
      await this.httpClient
        .post(
          `${configuration.menv.apiUrl()}/me/shipment/generate`,
          {
            orders,
          },
          this.requestConfig,
        )
        .toPromise();

      return { success: true };
    } catch (error) {
      this.logger.error({
        message: 'Error while generating labels',
        error,
        orders,
      });
      return null;
    }
  }

  async printLabels(orders: string[]): Promise<{ url: string }> {
    if (!orders || orders.length === 0) {
      throw new Error('Please, provide the orders to generate labels');
    }

    try {
      const response = await this.httpClient
        .post<{ url: string }>(
          `${configuration.menv.apiUrl()}/me/shipment/print`,
          {
            mode: 'public',
            orders,
          },
          this.requestConfig,
        )
        .toPromise();

      return { url: response.data.url };
    } catch (error) {
      this.logger.error({
        message: 'Error while printing labels',
        error,
        orders,
      });
      return null;
    }
  }
}
