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
