import { Post } from 'src/posts/contracts';

export function getSubTotal(posts: Post[]): number {
  return posts.reduce((acc, post) => post.price + acc, 0);
}

export const getDonationPercentage = (variableTax: number, fixedTax: number, posts: Post[]): number => {
  const pricesAfterClozeeTax = posts.map(p => [p.price * (1 - variableTax) - fixedTax, p.donationPercentage]);
  const weightedArithmeticMean =
    pricesAfterClozeeTax.reduce(
      (acc, [sellerAmount, donationPercentage]) => acc + sellerAmount * (donationPercentage || 0),
      0,
    ) / pricesAfterClozeeTax.reduce((acc, [price]) => acc + price, 0);

  return weightedArithmeticMean;
};

export const getClozeeAmount = (variableTax: number, fixedTax: number, posts: Post[]): number => {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = Math.floor(subTotal * variableTax + posts.length * fixedTax);
  return clozeeAmount;
};

export function getDonationAmount(variableTax: number, fixedTax: number, posts: Post[]): number {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = getClozeeAmount(variableTax, fixedTax, posts);
  const donationPercentage = getDonationPercentage(variableTax, fixedTax, posts);
  const sellerAmount = subTotal - clozeeAmount;
  const donationAmount = Math.floor(sellerAmount * (donationPercentage / 100));
  return donationAmount;
}

export function getSplitValues(
  variableTax: number,
  fixedTax: number,
  posts: Post[],
): [clozeeSplit: number, sellerSplit: number] {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = getClozeeAmount(variableTax, fixedTax, posts);
  const sellerAmount = subTotal - clozeeAmount;
  const donationAmount = getDonationAmount(variableTax, fixedTax, posts);
  return [clozeeAmount + donationAmount, sellerAmount - donationAmount];
}
