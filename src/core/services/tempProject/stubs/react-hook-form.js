module.exports = `// Type definitions for react-hook-form
import * as React from 'react';

export type FieldPath<T> = string;
export type FieldValue<T> = any;
export type FieldValues = Record<string, any>;

export interface UseFormReturn<T extends FieldValues = FieldValues> {
  control: Control<T>;
  register: UseFormRegister<T>;
  handleSubmit: UseFormHandleSubmit<T>;
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  reset: UseFormReset<T>;
  trigger: UseFormTrigger<T>;
  formState: FormState<T>;
  clearErrors: UseFormClearErrors<T>;
  setError: UseFormSetError<T>;
  getFieldState: UseFormGetFieldState<T>;
  unregister: UseFormUnregister<T>;
}

export interface Control<T extends FieldValues = FieldValues> {
  _subjects: any;
  _proxyFormState: any;
  _formState: FormState<T>;
}

export interface FormState<T extends FieldValues = FieldValues> {
  isDirty: boolean;
  isLoading: boolean;
  isSubmitted: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  isValid: boolean;
  isValidating: boolean;
  submitCount: number;
  dirtyFields: Partial<Record<FieldPath<T>, boolean>>;
  touchedFields: Partial<Record<FieldPath<T>, boolean>>;
  errors: FieldErrors<T>;
  defaultValues?: Partial<T>;
}

export type FieldErrors<T extends FieldValues = FieldValues> = Partial<Record<FieldPath<T>, FieldError>>;

export interface FieldError {
  type: string;
  message?: string;
  ref?: any;
}

export type UseFormRegister<T extends FieldValues = FieldValues> = <K extends FieldPath<T>>(
  name: K,
  options?: RegisterOptions<T, K>
) => {
  onChange: (event: any) => void;
  onBlur: (event: any) => void;
  ref: (instance: any) => void;
  name: K;
};

export type UseFormHandleSubmit<T extends FieldValues = FieldValues> = <U = T>(
  onValid: SubmitHandler<T>,
  onInvalid?: SubmitErrorHandler<T>
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

export type SubmitHandler<T extends FieldValues = FieldValues> = (data: T, event?: React.BaseSyntheticEvent) => void | Promise<void>;
export type SubmitErrorHandler<T extends FieldValues = FieldValues> = (errors: FieldErrors<T>, event?: React.BaseSyntheticEvent) => void | Promise<void>;

export type UseFormWatch<T extends FieldValues = FieldValues> = (name?: FieldPath<T> | FieldPath<T>[], defaultValue?: any) => any;
export type UseFormGetValues<T extends FieldValues = FieldValues> = (payload?: FieldPath<T> | FieldPath<T>[]) => any;
export type UseFormSetValue<T extends FieldValues = FieldValues> = <K extends FieldPath<T>>(name: K, value: FieldValue<T>, options?: SetValueConfig) => void;
export type UseFormReset<T extends FieldValues = FieldValues> = (values?: Partial<T>, options?: KeepStateOptions) => void;
export type UseFormTrigger<T extends FieldValues = FieldValues> = (name?: FieldPath<T> | FieldPath<T>[]) => Promise<boolean>;
export type UseFormClearErrors<T extends FieldValues = FieldValues> = (name?: FieldPath<T> | FieldPath<T>[]) => void;
export type UseFormSetError<T extends FieldValues = FieldValues> = (name: FieldPath<T>, error: ErrorOption, options?: { shouldFocus: boolean }) => void;
export type UseFormGetFieldState<T extends FieldValues = FieldValues> = (name: FieldPath<T>, formState?: FormState<T>) => FieldState;
export type UseFormUnregister<T extends FieldValues = FieldValues> = (name?: FieldPath<T> | FieldPath<T>[], options?: { keepValue?: boolean; keepError?: boolean; keepDirty?: boolean; keepTouched?: boolean }) => void;

export interface RegisterOptions<T extends FieldValues = FieldValues, K extends FieldPath<T> = FieldPath<T>> {
  required?: string | ValidationRule<boolean>;
  min?: ValidationRule<number | string>;
  max?: ValidationRule<number | string>;
  maxLength?: ValidationRule<number>;
  minLength?: ValidationRule<number>;
  pattern?: ValidationRule<RegExp>;
  validate?: Validate<FieldValue<T>, T> | Record<string, Validate<FieldValue<T>, T>>;
  valueAsNumber?: boolean;
  valueAsDate?: boolean;
  setValueAs?: (value: any) => any;
  shouldUnregister?: boolean;
  onChange?: (event: any) => void;
  onBlur?: (event: any) => void;
  disabled?: boolean;
  deps?: FieldPath<T> | FieldPath<T>[];
}

export type ValidationRule<T = any> = T | { value: T; message: string };
export type Validate<T, U extends FieldValues = FieldValues> = (value: T, formValues: U) => boolean | string | Promise<boolean | string>;

export interface SetValueConfig {
  shouldValidate?: boolean;
  shouldDirty?: boolean;
  shouldTouch?: boolean;
}

export interface KeepStateOptions {
  keepErrors?: boolean;
  keepDirty?: boolean;
  keepDirtyValues?: boolean;
  keepValues?: boolean;
  keepDefaultValues?: boolean;
  keepIsSubmitted?: boolean;
  keepTouched?: boolean;
  keepIsValid?: boolean;
  keepSubmitCount?: boolean;
}

export interface ErrorOption {
  type?: string;
  message?: string;
}

export interface FieldState {
  invalid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  error?: FieldError;
}

export interface UseFormProps<T extends FieldValues = FieldValues> {
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
  defaultValues?: Partial<T>;
  resolver?: any;
  context?: any;
  criteriaMode?: 'firstError' | 'all';
  shouldFocusError?: boolean;
  shouldUnregister?: boolean;
  shouldUseNativeValidation?: boolean;
  delayError?: number;
}

// Основные хуки
export function useForm<T extends FieldValues = FieldValues>(props?: UseFormProps<T>): UseFormReturn<T>;

export interface ControllerProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  control?: Control<T>;
  defaultValue?: any;
  rules?: RegisterOptions<T>;
  shouldUnregister?: boolean;
  render: ({ field, fieldState, formState }: ControllerRenderProps<T>) => React.ReactElement;
}

export interface ControllerRenderProps<T extends FieldValues = FieldValues> {
  field: {
    name: FieldPath<T>;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    ref: React.Ref<any>;
  };
  fieldState: FieldState;
  formState: FormState<T>;
}

export function Controller<T extends FieldValues = FieldValues>(props: ControllerProps<T>): React.ReactElement;

// Провайдер контекста
export interface FormProviderProps<T extends FieldValues = FieldValues> extends UseFormReturn<T> {
  children: React.ReactNode;
}

export function FormProvider<T extends FieldValues = FieldValues>(props: FormProviderProps<T>): React.ReactElement;

// Дополнительные хуки
export function useFormContext<T extends FieldValues = FieldValues>(): UseFormReturn<T>;
export function useController<T extends FieldValues = FieldValues>(props: { name: FieldPath<T>; control?: Control<T>; defaultValue?: any; rules?: RegisterOptions<T> }): { field: any; fieldState: FieldState; formState: FormState<T> };
export function useWatch<T extends FieldValues = FieldValues>(props?: { name?: FieldPath<T> | FieldPath<T>[]; control?: Control<T>; defaultValue?: any; disabled?: boolean; exact?: boolean }): any;
export function useFormState<T extends FieldValues = FieldValues>(props?: { control?: Control<T>; name?: FieldPath<T> | FieldPath<T>[]; disabled?: boolean; exact?: boolean }): FormState<T>;
export function useFieldArray<T extends FieldValues = FieldValues>(props: { control?: Control<T>; name: FieldPath<T>; keyName?: string; shouldUnregister?: boolean }): {
  fields: any[];
  append: (value: any, options?: { shouldFocus?: boolean; focusIndex?: number; focusName?: string }) => void;
  prepend: (value: any, options?: { shouldFocus?: boolean; focusIndex?: number; focusName?: string }) => void;
  insert: (index: number, value: any, options?: { shouldFocus?: boolean; focusIndex?: number; focusName?: string }) => void;
  swap: (indexA: number, indexB: number) => void;
  move: (from: number, to: number) => void;
  update: (index: number, value: any) => void;
  replace: (value: any) => void;
  remove: (index?: number | number[]) => void;
};

// Default export для совместимости
declare const reactHookForm: {
  useForm: typeof useForm;
  Controller: typeof Controller;
  FormProvider: typeof FormProvider;
  useFormContext: typeof useFormContext;
  useController: typeof useController;
  useWatch: typeof useWatch;
  useFormState: typeof useFormState;
  useFieldArray: typeof useFieldArray;
};

export default reactHookForm;`;
