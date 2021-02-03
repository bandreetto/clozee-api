import { registerEnumType } from '@nestjs/graphql';

export enum POST_CONDITIONS {
  NEW = 'NEW',
  USED_NEW = 'USED_NEW',
  USED_GOOD = 'USED_GOOD',
  USED_FAIR = 'USED_FAIR',
}

registerEnumType(POST_CONDITIONS, {
  name: 'POST_CONDITIONS',
  description: "Possible post's product conditions.",
});

export enum SIZES {
  P = 'P',
  M = 'M',
  G = 'G',
  s38 = '38',
  s39 = '39',
  s40 = '40',
  s41 = '41',
  s42 = '42',
  s43 = '43',
  s44 = '44',
  s45 = '45',
}

registerEnumType(SIZES, {
  name: 'SIZES',
  description: 'Possible product sizes',
});
