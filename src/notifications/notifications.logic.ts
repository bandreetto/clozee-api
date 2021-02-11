export function formatEmailCurrency(valueInCents: number): string {
  const reais = valueInCents / 100;
  return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
