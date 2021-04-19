import { FIXED_TAX, TAX_PERCENTAGE } from 'src/common/contants';
import { Post } from 'src/posts/contracts';

export function getSubTotal(posts: Post[]): number {
  return posts.reduce((acc, post) => post.price + acc, 0);
}

const _getDonationPercentage = (clozeePercentage: number, fixedTax: number) => (posts: Post[]): number => {
  const pricesAfterClozeeTax = posts.map(p => [p.price * (1 - clozeePercentage) - fixedTax, p.donationPercentage])
  const weightedArithmeticMean = pricesAfterClozeeTax.reduce(
    (acc, [sellerAmount, donationPercentage]) => acc + sellerAmount * (donationPercentage || 0),
    0,
  )/pricesAfterClozeeTax.reduce((acc, [price]) => acc + price, 0);

  return weightedArithmeticMean
}

export const getDonationPercentage = _getDonationPercentage(TAX_PERCENTAGE, FIXED_TAX)

const _getClozeeAmount = (clozeePercentage: number, fixedTax: number) => (posts: Post[]): number => {
  const subTotal = getSubTotal(posts)
  const clozeeAmount = Math.floor(
    subTotal * clozeePercentage + posts.length * fixedTax,
  );
  return clozeeAmount;
}

export const getClozeeAmount = _getClozeeAmount(TAX_PERCENTAGE, FIXED_TAX)

export function getDonationAmount(posts: Post[]) {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = getClozeeAmount(posts);
  const donationPercentage = getDonationPercentage(posts);
  const sellerAmount = subTotal - clozeeAmount;
  const donationAmount = Math.floor(sellerAmount * (donationPercentage/100));
  return donationAmount;
}

export function getSplitValues(posts: Post[]): [clozeeSplit: number, sellerSplit: number] {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = getClozeeAmount(posts);
  const sellerAmount = subTotal - clozeeAmount;
  const donationAmount = getDonationAmount(posts);
  return [clozeeAmount + donationAmount, sellerAmount - donationAmount];
};
