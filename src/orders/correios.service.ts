import { HttpService, Injectable } from '@nestjs/common';
import { xml2js } from 'xml-js';
import { DeliveryInfo } from './contracts/delivery-info';
import { CorreiosResponse } from './contracts/dtos';

@Injectable()
export class CorreiosService {
  constructor(private readonly httpClient: HttpService) {}

  async getDeliveryPriceAndTime(): Promise<DeliveryInfo> {
    const xmlResponse = await this.httpClient
      .get('http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx', {
        params: {
          sCepOrigem: '70002900',
          sCepDestino: '04547000',
          nVlPeso: 1,
          nCdFormato: 1,
          nVlComprimento: 20,
          nVlAltura: 20,
          nVlLargura: 20,
          nVlDiametro: 0,
          sCdMaoPropria: 'n',
          nVlValorDeclarado: 0,
          sCdAvisoRecebimento: 'n',
          nCdServico: '04510',
          StrRetorno: 'xml',
        },
      })
      .toPromise();
    const result = xml2js(xmlResponse.data, {
      compact: true,
    }) as CorreiosResponse;
    return {
      price: result.Servicos.cServico.Valor._text,
      deliveryTime: Number(result.Servicos.cServico.PrazoEntrega._text),
    };
  }
}
