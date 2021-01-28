export interface CorreiosResponse {
  Servicos: {
    cServico: {
      Codigo: CorreiosValue;
      Valor: CorreiosValue;
      PrazoEntrega: CorreiosValue;
      ValorSemAdicionais: CorreiosValue;
      ValorMaoPropria: CorreiosValue;
      ValorAvisoRecebimento: CorreiosValue;
      ValorValorDeclarado: CorreiosValue;
      EntregaDomiciliar: CorreiosValue;
      EntregaSabado: CorreiosValue;
      Erro: CorreiosValue;
    };
  };
}

export interface CorreiosValue {
  _text: string;
}
