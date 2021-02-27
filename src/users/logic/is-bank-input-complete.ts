import { BankInfo } from './../contracts/bank-info';
export const isBankInputComplete = (bankInput: BankInfo) => {
  if (!bankInput) {
    return false;
  }
  const {
    account,
    accountDv,
    accountType,
    agency,
    bank,
    holderDocument,
    holderName,
  } = bankInput;

  return (
    !!bank &&
    !!agency &&
    !!account &&
    !!accountDv &&
    !!holderDocument &&
    !!accountType &&
    !!holderName
  );
};
