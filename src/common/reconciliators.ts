export function reconciliateByKey<T extends keyof U, U>(
  key: T,
  keysArray: Array<U[T]>,
  objectsArray: U[],
) {
  return keysArray.map(keyValue =>
    objectsArray.find(obj => obj[key] === keyValue),
  );
}
