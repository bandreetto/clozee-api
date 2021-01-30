import { HttpService, Injectable } from '@nestjs/common';
import { xml2js } from 'xml-js';
import { DeliveryInfo } from './contracts/delivery-info';
import { CorreiosResponse, CORREIOS_SERVICE_CODES } from './contracts/dtos';

@Injectable()
export class CorreiosService {
  constructor(private readonly httpClient: HttpService) {}

  async getDeliveryPriceAndTime(
    originCpf: string,
    destinationCpf: string,
  ): Promise<DeliveryInfo> {
    const xmlResponse = await this.httpClient
      .get('http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx', {
        params: {
          sCepOrigem: originCpf,
          sCepDestino: destinationCpf,
          nVlPeso: 1,
          nCdFormato: 1,
          nVlComprimento: 30,
          nVlAltura: 30,
          nVlLargura: 30,
          nVlDiametro: 0,
          sCdMaoPropria: 'n',
          nVlValorDeclarado: 0,
          sCdAvisoRecebimento: 'n',
          nCdServico: CORREIOS_SERVICE_CODES.PAC,
          StrRetorno: 'xml',
        },
      })
      .toPromise();
    const result = xml2js(xmlResponse.data, {
      compact: true,
    }) as CorreiosResponse;
    return {
      price: Number(result.Servicos.cServico.Valor._text.replace(',', '')),
      deliveryTime: Number(result.Servicos.cServico.PrazoEntrega._text),
    };
  }
}
