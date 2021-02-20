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
  PP = 'PP',
  P = 'P',
  M = 'M',
  G = 'G',
  GG = 'GG',
  GGG = 'GGG',
  unique = 'Único',
  s33 = '33',
  s34 = '34',
  s35 = '35',
  s36 = '36',
  s37 = '37',
  s38 = '38',
  s39 = '39',
  s40 = '40',
  s41 = '41',
  s42 = '42',
  s43 = '43',
  s44 = '44',
  s45 = '45',
  s46 = '46',
  s48 = '48',
  s50 = '50',
  s52 = '52',
  s54 = '54',
  s56 = '56',
  s58 = '58',
  s60 = '60',
  s62 = '62',
  s64 = '64',
  s66 = '66',
  s68 = '68',
  other = 'Outro',
}

registerEnumType(SIZES, {
  name: 'SIZES',
  description: 'Possible product sizes',
});
