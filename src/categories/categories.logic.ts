import { Category } from './contracts';

const OTHERS_CATEGORY_NAME = 'Outros';

export const isOthersCategory = (cat: Category) =>
  cat.name === OTHERS_CATEGORY_NAME;
