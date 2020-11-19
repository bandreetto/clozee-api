export function reconciliateByKey<T extends keyof U, U>(
  key: T,
  keysArray: Array<U[T]>,
  objectsArray: U[],
) {
  try {
    return keysArray.map(keyValue =>
      objectsArray.find(obj => obj[key] === keyValue),
    );
  } catch (err) {
    console.log({ key, keysArray, objectsArray });
    throw err;
  }
}
