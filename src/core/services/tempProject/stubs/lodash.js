module.exports = `// Type definitions for Lodash
export function clone<T>(value: T): T;
export function cloneDeep<T>(value: T): T;
export function isEqual(value: any, other: any): boolean;
export function merge<T>(object: T, ...sources: any[]): T;
export function pick<T, K extends keyof T>(object: T, ...props: K[]): Pick<T, K>;
export function omit<T, K extends keyof T>(object: T, ...props: K[]): Omit<T, K>;
export function debounce<T extends (...args: any[]) => any>(func: T, wait?: number): T;
export function throttle<T extends (...args: any[]) => any>(func: T, wait?: number): T;
export function uniq<T>(array: T[]): T[];
export function flatten<T>(array: T[][]): T[];
export function groupBy<T>(collection: T[], iteratee: (value: T) => string): { [key: string]: T[] };

declare const _: {
  clone: typeof clone;
  cloneDeep: typeof cloneDeep;
  isEqual: typeof isEqual;
  merge: typeof merge;
  pick: typeof pick;
  omit: typeof omit;
  debounce: typeof debounce;
  throttle: typeof throttle;
  uniq: typeof uniq;
  flatten: typeof flatten;
  groupBy: typeof groupBy;
};

export default _;`;
