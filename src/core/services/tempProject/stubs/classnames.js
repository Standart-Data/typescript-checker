module.exports = `// Type definitions for classnames

export type Value = string | number | boolean | undefined | null;
export type Mapping = Record<string, any>;
export interface ArgumentArray extends Array<Argument> {}
export type Argument = Value | Mapping | ArgumentArray;

export interface ClassNamesFn {
  (...args: ArgumentArray): string;
}

declare const classNames: ClassNamesFn;

export default classNames;`;
