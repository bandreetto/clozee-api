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
  UNIQUE = 'UNIQUE',
  PP = 'PP',
  P = 'P',
  M = 'M',
  G = 'G',
  GG = 'GG',
  GGG = 'GGG',
  S33 = 'S33',
  S34 = 'S34',
  S35 = 'S35',
  S36 = 'S36',
  S37 = 'S37',
  S38 = 'S38',
  S39 = 'S39',
  S40 = 'S40',
  S41 = 'S41',
  S42 = 'S42',
  S43 = 'S43',
  S44 = 'S44',
  S45 = 'S45',
  S46 = 'S46',
  S48 = 'S48',
  S50 = 'S50',
  S52 = 'S52',
  S54 = 'S54',
  S56 = 'S56',
  S58 = 'S58',
  S60 = 'S60',
  S62 = 'S62',
  S64 = 'S64',
  S66 = 'S66',
  S68 = 'S68',
  OTHER = 'OTHER',
}

registerEnumType(SIZES, {
  name: 'SIZES',
  description: 'Possible product sizes',
});
