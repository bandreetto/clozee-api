import { registerEnumType } from '@nestjs/graphql';

export enum ACCOUNT_TYPES {
  CURRENT = 'CURRENT',
  SAVINGS = 'SAVINGS',
  JOINT_CURRENT = 'JOINT_CURRENT',
  JOINT_SAVINGS = 'JOINT_SAVINGS',
}

registerEnumType(ACCOUNT_TYPES, {
  name: 'ACCOUNT_TYPES',
  description: 'Bank account types.',
});

export enum GENDER_TAGS {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
}

registerEnumType(GENDER_TAGS, {
  name: 'GENDER_TAGS',
  description: 'Possible gender tags to be used on feed customization.',
});
