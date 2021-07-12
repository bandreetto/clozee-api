import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@sendgrid/client';
import configuration from '../config/configuration';
import { Order } from '../orders/contracts';
import { Post } from '../posts/contracts';
import { User } from '../users/contracts';
import { formatEmailCurrency } from '../notifications/notifications.logic';

@Injectable()
export class MailerService {
  logger = new Logger(MailerService.name);
  sgClient: Client;

  constructor() {
    const sgClient = new Client();
    sgClient.setApiKey(configuration.sendgrid.key());
    this.sgClient = sgClient;
  }

  async sendSellerMail(
    buyer: User,
    seller: User,
    order: Order,
    soldPosts: Post[],
    subTotal: number,
    taxes: number,
    sellerTotal: number,
    labelUrl: string,
  ): Promise<void> {
    const buyersAddressWithoutComplement = `${buyer.address.street}, ${buyer.address.number}`;
    const buyersAddressWithComplement = `${buyersAddressWithoutComplement}, ${buyer.address.complement}`;
    await this.sgClient
      .request({
        method: 'POST',
        url: '/v3/mail/send',
        body: {
          personalizations: [
            {
              to: [
                {
                  email: seller.email,
                  name: seller.name || seller.username,
                },
              ],
              dynamic_template_data: {
                order_number: order.number,
                recipient_username: buyer.username,
                recipient_full_name: buyer.name,
                recipient_phone_number: buyer.phoneNumber,
                recipient_address_line_1: buyer.address.complement
                  ? buyersAddressWithComplement
                  : buyersAddressWithoutComplement,
                recipient_address_line_2: `${buyer.address.city} - ${buyer.address.state} | ${buyer.address.zipCode}`,
                orderItems: soldPosts.map(post => ({
                  name: post.title,
                  size: post.size,
                  price: formatEmailCurrency(post.price),
                  image: post.images[0],
                })),
                subtotal: formatEmailCurrency(subTotal),
                taxes: formatEmailCurrency(taxes),
                seller_total: formatEmailCurrency(sellerTotal),
                label_url: labelUrl,
              },
            },
          ],
          from: {
            email: 'contato@clozee.com.br',
            name: 'Clozee',
          },
          reply_to: {
            email: 'contato@clozee.com.br',
            name: 'Clozee',
          },
          template_id: 'd-64580261f5004915aef8a5d1d2271646',
          mail_settings: {
            sandbox_mode: {
              enable: configuration.sendgrid.sandbox(),
            },
          },
        },
      })
      .catch(error =>
        this.logger.error({
          message: "An error occoured while sending seller's email.",
          error,
        }),
      );
  }

  async sendBuyerEmail(buyer: User, order: Order, boughtPosts: Post[], subTotal: number, total: number) {
    const buyersAddressWithoutComplement = `${buyer.address.street}, ${buyer.address.number}`;
    const buyersAddressWithComplement = `${buyersAddressWithoutComplement}, ${buyer.address.complement}`;
    await this.sgClient
      .request({
        method: 'POST',
        url: '/v3/mail/send',
        body: {
          personalizations: [
            {
              to: [
                {
                  email: buyer.email,
                  name: buyer.name || buyer.username,
                },
              ],
              dynamic_template_data: {
                order_number: order.number,
                username: buyer.username,
                full_name: buyer.name,
                phone_number: buyer.phoneNumber,
                address_line_1: buyer.address.complement ? buyersAddressWithComplement : buyersAddressWithoutComplement,
                address_line_2: `${buyer.address.city} - ${buyer.address.state} | ${buyer.address.zipCode}`,
                orderItems: boughtPosts.map(post => ({
                  name: post.title,
                  size: post.size,
                  price: formatEmailCurrency(post.price),
                  image: post.images[0],
                })),
                subtotal: formatEmailCurrency(subTotal),
                delivery_fee: formatEmailCurrency(order.deliveryInfo.price),
                total: formatEmailCurrency(total),
              },
            },
          ],
          from: {
            email: 'contato@clozee.com.br',
            name: 'Clozee',
          },
          reply_to: {
            email: 'contato@clozee.com.br',
            name: 'Clozee',
          },
          template_id: 'd-70d95bd77ff5444f8d6bd3b7a70632eb',
          mail_settings: {
            sandbox_mode: {
              enable: configuration.sendgrid.sandbox(),
            },
          },
        },
      })
      .catch(error =>
        this.logger.error({
          message: "An error occoured while sending buyer's email.",
          error,
        }),
      );
  }
}
