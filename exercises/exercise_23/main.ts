function splitArray<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const inappropriate: T[] = [];
  const appropriate: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const currentElement: T = array[i];

    if (predicate(currentElement)) {
      appropriate.push(currentElement);
    } else {
      inappropriate.push(currentElement);
    }
  }

  return [inappropriate, appropriate];
}

const numberSplit = splitArray(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  (number) => number % 2 === 0
);
const stringSplit = splitArray(
  ["one", "two", "three"],
  (word) => word.length > 3
);
