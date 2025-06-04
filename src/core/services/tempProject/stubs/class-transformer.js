module.exports = `// Type definitions for class-transformer
export function Transform(transformFn?: (params: any) => any): PropertyDecorator;
export function Type(typeFunction?: () => any): PropertyDecorator;
export function Exclude(): PropertyDecorator;
export function Expose(): PropertyDecorator;
export function plainToClass<T>(cls: new (...args: any[]) => T, plain: any): T;
export function classToPlain<T>(obj: T): any;
export function serialize(obj: any): string;
export function deserialize<T>(cls: new (...args: any[]) => T, json: string): T;

// Default export for compatibility
declare const classTransformer: {
  Transform: typeof Transform;
  Type: typeof Type;
  Exclude: typeof Exclude;
  Expose: typeof Expose;
  plainToClass: typeof plainToClass;
  classToPlain: typeof classToPlain;
  serialize: typeof serialize;
  deserialize: typeof deserialize;
};

export default classTransformer;`;
