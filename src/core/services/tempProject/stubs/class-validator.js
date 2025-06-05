module.exports = `// Type definitions for class-validator

// Validation options
export interface ValidationOptions {
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  groups?: string[];
  dismissDefaultMessages?: boolean;
  validationError?: {
    target?: boolean;
    property?: boolean;
    value?: boolean;
    constraints?: boolean;
  };
  forbidUnknownValues?: boolean;
  stopAtFirstError?: boolean;
  strictGroups?: boolean;
  message?: string | ((validationArguments: any) => string);
  each?: boolean;
  always?: boolean;
  context?: any;
}

// Validation error
export interface ValidationError {
  target?: object;
  property: string;
  value?: any;
  constraints?: { [type: string]: string };
  children?: ValidationError[];
  contexts?: { [type: string]: any };
}

// Transform functions
export interface TransformFnParams {
  value: any;
  key: string;
  obj: any;
  type: any;
  options: ClassTransformOptions;
}

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

// Main validation function
export function validate(object: object, options?: ValidationOptions): Promise<ValidationError[]>;
export function validateSync(object: object, options?: ValidationOptions): ValidationError[];
export function validateOrReject(object: object, options?: ValidationOptions): Promise<void>;

// Property decorators
export function IsString(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNumber(options?: { allowNaN?: boolean; allowInfinity?: boolean; maxDecimalPlaces?: number }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsInt(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBoolean(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsEmail(options?: { allow_display_name?: boolean; require_display_name?: boolean; allow_utf8_local_part?: boolean; require_tld?: boolean; ignore_max_length?: boolean; allow_ip_domain?: boolean; domain_specific_validation?: boolean; blacklisted_chars?: string; host_blacklist?: string[] }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsUrl(options?: { protocols?: string[]; require_tld?: boolean; require_protocol?: boolean; require_host?: boolean; require_port?: boolean; require_valid_protocol?: boolean; allow_underscores?: boolean; host_whitelist?: string[]; host_blacklist?: string[]; allow_trailing_dot?: boolean; allow_protocol_relative_urls?: boolean; allow_fragments?: boolean; allow_query_components?: boolean; validate_length?: boolean }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsUUID(version?: '3' | '4' | '5' | 'all', validationOptions?: ValidationOptions): PropertyDecorator;
export function IsDate(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsDateString(options?: { strict?: boolean }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISO8601(options?: { strict?: boolean; strictSeparator?: boolean }, validationOptions?: ValidationOptions): PropertyDecorator;

// Length validators
export function Length(min: number, max?: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function MinLength(min: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function MaxLength(max: number, validationOptions?: ValidationOptions): PropertyDecorator;

// Number validators
export function Min(min: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function Max(max: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsPositive(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNegative(validationOptions?: ValidationOptions): PropertyDecorator;

// Array validators
export function IsArray(validationOptions?: ValidationOptions): PropertyDecorator;
export function ArrayNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator;
export function ArrayMinSize(min: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function ArrayMaxSize(max: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function ArrayUnique(identifier?: (o: any) => any, validationOptions?: ValidationOptions): PropertyDecorator;

// Conditional validators
export function IsOptional(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsEmpty(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsDefined(validationOptions?: ValidationOptions): PropertyDecorator;

// Object validators
export function IsObject(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNotEmptyObject(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsInstance(targetType: new (...args: any[]) => any, validationOptions?: ValidationOptions): PropertyDecorator;

// Type validators
export function IsEnum(entity: object, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsIn(values: any[], validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNotIn(values: any[], validationOptions?: ValidationOptions): PropertyDecorator;

// String validators
export function IsAlpha(locale?: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsAlphanumeric(locale?: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsDecimal(options?: { decimal_digits?: string; force_decimal?: boolean; locale?: string }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsAscii(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBase32(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBase58(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBase64(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsByteLength(min: number, max?: number, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsCreditCard(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsCurrency(options?: any, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsEthereumAddress(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBtcAddress(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsDataURI(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMimeType(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsHash(algorithm: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsHexColor(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsRgbColor(includePercentValues?: boolean, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsHSL(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsHexadecimal(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsOctal(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMacAddress(options?: any, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsIP(version?: '4' | '6', validationOptions?: ValidationOptions): PropertyDecorator;
export function IsPort(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISBN(version?: '10' | '13', validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISIN(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISRC(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISSN(options?: { case_sensitive?: boolean; require_hyphen?: boolean }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsJSON(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsJWT(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsLowercase(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsLatLong(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsLatitude(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsLongitude(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMobilePhone(locale?: string | string[], options?: any, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISO31661Alpha2(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsISO31661Alpha3(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsLocale(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsPhoneNumber(region?: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMongoId(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMultibyte(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNumberString(options?: { no_symbols?: boolean }, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsSurrogatePair(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsUppercase(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsRFC3339(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsVariableWidth(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsWhitelisted(chars: string | string[], validationOptions?: ValidationOptions): PropertyDecorator;
export function IsBlacklisted(chars: string | string[], validationOptions?: ValidationOptions): PropertyDecorator;
export function Contains(seed: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function NotContains(seed: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsFullWidth(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsHalfWidth(validationOptions?: ValidationOptions): PropertyDecorator;
export function Matches(pattern: RegExp | string, modifiers?: string, validationOptions?: ValidationOptions): PropertyDecorator;
export function IsMilitaryTime(validationOptions?: ValidationOptions): PropertyDecorator;
export function IsTimeZone(validationOptions?: ValidationOptions): PropertyDecorator;

// Nested validation
export function ValidateNested(validationOptions?: ValidationOptions): PropertyDecorator;
export function ValidateIf(condition: (object: any, value: any) => boolean, validationOptions?: ValidationOptions): PropertyDecorator;
export function ValidateBy(options: { name: string; validator: (value: any, args?: any) => boolean; defaultMessage?: (args?: any) => string }, validationOptions?: ValidationOptions): PropertyDecorator;
export function ValidatePromise(validationOptions?: ValidationOptions): PropertyDecorator;

// Custom validation
export function Validate(constraintClass: Function, constraints?: any[], validationOptions?: ValidationOptions): PropertyDecorator;
export function IsNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator;

// Class validation
export function ValidatorConstraint(options?: { name?: string; async?: boolean }): ClassDecorator;
export interface ValidatorConstraintInterface {
  validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean>;
  defaultMessage?(validationArguments?: ValidationArguments): string;
}

export interface ValidationArguments {
  value: any;
  constraints: any[];
  targetName: string;
  object: object;
  property: string;
}

// Transform decorators
export function Transform(transformFn: (params: TransformFnParams) => any, options?: { toClassOnly?: boolean; toPlainOnly?: boolean }): PropertyDecorator;
export function Type(typeFunction?: () => Function, options?: { keepDiscriminatorProperty?: boolean; discriminator?: { property: string; subTypes: Array<{ value: Function; name: string }> } }): PropertyDecorator;
export function Exclude(options?: { toClassOnly?: boolean; toPlainOnly?: boolean }): PropertyDecorator;
export function Expose(options?: { name?: string; since?: number; until?: number; groups?: string[]; toClassOnly?: boolean; toPlainOnly?: boolean }): PropertyDecorator;

// Default export for compatibility
declare const classValidator: {
  validate: typeof validate;
  validateSync: typeof validateSync;
  validateOrReject: typeof validateOrReject;
  IsString: typeof IsString;
  IsNumber: typeof IsNumber;
  IsEmail: typeof IsEmail;
  Length: typeof Length;
  IsOptional: typeof IsOptional;
  IsNotEmpty: typeof IsNotEmpty;
  MinLength: typeof MinLength;
  MaxLength: typeof MaxLength;
  Min: typeof Min;
  Max: typeof Max;
  IsArray: typeof IsArray;
  IsBoolean: typeof IsBoolean;
  IsDate: typeof IsDate;
  IsEnum: typeof IsEnum;
  IsInt: typeof IsInt;
  IsUUID: typeof IsUUID;
  ValidateNested: typeof ValidateNested;
  Transform: typeof Transform;
  Type: typeof Type;
  Exclude: typeof Exclude;
  Expose: typeof Expose;
};

export default classValidator;`;
