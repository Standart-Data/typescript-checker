module.exports = `// Type definitions for classnames

declare type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | boolean;

declare interface ClassDictionary {
  [id: string]: any;
}

declare interface ClassArray extends Array<ClassValue> { }

declare function classNames(...classes: ClassValue[]): string;

export default classNames;`;
