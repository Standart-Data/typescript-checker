module.exports = `// Type definitions for class-transformer

// Transform options
export interface ClassTransformOptions {
  strategy?: 'excludeAll' | 'exposeAll';
  excludeExtraneousValues?: boolean;
  groups?: string[];
  version?: number;
  excludePrefixes?: string[];
  ignoreDecorators?: boolean;
  targetMaps?: Map<any, any>[];
  enableCircularCheck?: boolean;
  enableImplicitConversion?: boolean;
  exposeDefaultValues?: boolean;
  exposeUnsetFields?: boolean;
  transformer?: any;
}

// Transform function parameters
export interface TransformFnParams {
  value: any;
  key: string;
  obj: any;
  type: TransformationType;
  options: ClassTransformOptions;
}

export enum TransformationType {
  PLAIN_TO_CLASS = 0,
  CLASS_TO_PLAIN = 1,
  CLASS_TO_CLASS = 2,
}

// Type options for @Type decorator
export interface TypeOptions {
  keepDiscriminatorProperty?: boolean;
  discriminator?: {
    property: string;
    subTypes: Array<{ value: Function; name: string }>;
  };
}

// Expose options
export interface ExposeOptions {
  name?: string;
  since?: number;
  until?: number;
  groups?: string[];
  toClassOnly?: boolean;
  toPlainOnly?: boolean;
}

// Exclude options
export interface ExcludeOptions {
  toClassOnly?: boolean;
  toPlainOnly?: boolean;
}

// Transform options for @Transform decorator
export interface TransformOptions {
  toClassOnly?: boolean;
  toPlainOnly?: boolean;
  groups?: string[];
  since?: number;
  until?: number;
}

// Main transformation functions
export function plainToClass<T, V>(cls: ClassConstructor<T>, plain: V[], options?: ClassTransformOptions): T[];
export function plainToClass<T, V>(cls: ClassConstructor<T>, plain: V, options?: ClassTransformOptions): T;
export function plainToClassFromExist<T, V>(clsObject: T, plain: V, options?: ClassTransformOptions): T;
export function plainToClassFromExist<T, V>(clsObject: T[], plain: V[], options?: ClassTransformOptions): T[];

export function classToPlain<T>(object: T, options?: ClassTransformOptions): Record<string, any>;
export function classToPlain<T>(object: T[], options?: ClassTransformOptions): Record<string, any>[];
export function classToPlainFromExist<T>(object: T, plainObject: any, options?: ClassTransformOptions): Record<string, any>;

export function classToClass<T>(object: T, options?: ClassTransformOptions): T;
export function classToClass<T>(object: T[], options?: ClassTransformOptions): T[];
export function classToClassFromExist<T>(object: T, fromObject: T, options?: ClassTransformOptions): T;

export function serialize<T>(object: T, options?: ClassTransformOptions): string;
export function serialize<T>(object: T[], options?: ClassTransformOptions): string;

export function deserialize<T>(cls: ClassConstructor<T>, json: string, options?: ClassTransformOptions): T;
export function deserializeArray<T>(cls: ClassConstructor<T>, json: string, options?: ClassTransformOptions): T[];

// Instance checking
export function instanceToPlain<T>(object: T, options?: ClassTransformOptions): Record<string, any>;
export function instanceToPlain<T>(object: T[], options?: ClassTransformOptions): Record<string, any>[];
export function plainToInstance<T, V>(cls: ClassConstructor<T>, plain: V[], options?: ClassTransformOptions): T[];
export function plainToInstance<T, V>(cls: ClassConstructor<T>, plain: V, options?: ClassTransformOptions): T;
export function instanceToInstance<T>(object: T, options?: ClassTransformOptions): T;
export function instanceToInstance<T>(object: T[], options?: ClassTransformOptions): T[];

// Class constructor type
export interface ClassConstructor<T = {}> {
  new (...args: any[]): T;
}

// Property decorators
export function Transform(transformFn: (params: TransformFnParams) => any, options?: TransformOptions): PropertyDecorator;
export function Type(typeFunction?: (type?: TypeHelpOptions) => Function, options?: TypeOptions): PropertyDecorator;
export function Exclude(options?: ExcludeOptions): PropertyDecorator & ClassDecorator;
export function Expose(options?: ExposeOptions): PropertyDecorator & ClassDecorator;

// Type help options for @Type decorator
export interface TypeHelpOptions {
  newObject: any;
  object: any;
  property: string;
}

// Legacy aliases for backward compatibility
export { plainToClass as plainToClassFromExist };
export { classToPlain as classToPlainFromExist };

// Default export for compatibility
declare const classTransformer: {
  plainToClass: typeof plainToClass;
  plainToInstance: typeof plainToInstance;
  classToPlain: typeof classToPlain;
  instanceToPlain: typeof instanceToPlain;
  classToClass: typeof classToClass;
  instanceToInstance: typeof instanceToInstance;
  serialize: typeof serialize;
  deserialize: typeof deserialize;
  deserializeArray: typeof deserializeArray;
  Transform: typeof Transform;
  Type: typeof Type;
  Exclude: typeof Exclude;
  Expose: typeof Expose;
  TransformationType: typeof TransformationType;
};

export default classTransformer;`;
