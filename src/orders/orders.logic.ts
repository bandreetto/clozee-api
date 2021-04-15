import { FIXED_TAX, TAX_PERCENTAGE } from 'src/common/contants';
import { Post } from 'src/posts/contracts';

export function getSubTotal(posts: Post[]): number {
  return posts.reduce((acc, post) => post.price + acc, 0);
}

const getSplitValuesInternal = (clozeePercetage: number, fixedTax: number) => (
  posts: Post[],
): [clozeeAmount: number, sellerAmount: number] => {
  const subTotal = getSubTotal(posts);
  const clozeeAmount = Math.floor(
    subTotal * clozeePercetage + posts.length * fixedTax,
  );
  const sellerAmount = subTotal - clozeeAmount;
  return [clozeeAmount, sellerAmount];
};

export const getSplitValues = getSplitValuesInternal(TAX_PERCENTAGE, FIXED_TAX);

export function getDonationAmount(posts: Post[]): number {
  return posts.reduce(
    (acc, curr) => acc + curr.price * (curr.donationPercentage / 100 || 0),
    0,
  );
}
