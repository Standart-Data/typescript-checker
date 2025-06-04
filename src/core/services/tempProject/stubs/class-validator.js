module.exports = `// Type definitions for class-validator
export function IsString(): PropertyDecorator;
export function IsNumber(): PropertyDecorator;
export function IsEmail(): PropertyDecorator;
export function Length(min: number, max?: number): PropertyDecorator;
export function validate(object: any): Promise<any[]>;
export function IsOptional(): PropertyDecorator;
export function IsNotEmpty(): PropertyDecorator;

// Default export for compatibility
declare const classValidator: {
  IsString: typeof IsString;
  IsNumber: typeof IsNumber;
  IsEmail: typeof IsEmail;
  Length: typeof Length;
  validate: typeof validate;
  IsOptional: typeof IsOptional;
  IsNotEmpty: typeof IsNotEmpty;
};

export default classValidator;`;
