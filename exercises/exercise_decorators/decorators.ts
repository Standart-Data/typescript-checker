// Файл с декораторами для TypeScript

// Определения типов декораторов
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// Декораторы для классов

/**
 * Декоратор компонента
 */
export function Component(config: { selector: string; template?: string }) {
  console.log(`Создание компонента с селектором ${config.selector}`);
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      selector = config.selector;
      template = config.template || "";

      getInfo() {
        return `Компонент: ${config.selector}`;
      }
    };
  };
}

/**
 * Декоратор для логгирования класса
 */
export function Logger(level: LogLevel = LogLevel.INFO) {
  return function (target: any) {
    console.log(`Логирование класса ${target.name} с уровнем ${level}`);

    // Добавляем метод логирования в прототип класса
    target.prototype.log = function (message: string) {
      console.log(`[${level}] ${message}`);
    };
  };
}

// Декораторы для свойств

/**
 * Декоратор для обязательного свойства
 */
export function Required(target: any, propertyKey: string) {
  console.log(`Свойство ${propertyKey} помечено как обязательное`);

  // Проверяем свойство при установке значения
  let value: any;
  const getter = function () {
    return value;
  };
  const setter = function (newValue: any) {
    if (newValue === undefined || newValue === null) {
      throw new Error(`Свойство ${propertyKey} обязательно для заполнения`);
    }
    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

/**
 * Декоратор для проверки длины строки
 */
export function MaxLength(max: number) {
  return function (target: any, propertyKey: string) {
    console.log(
      `Установлена максимальная длина ${max} для свойства ${propertyKey}`
    );

    let value: string;
    const getter = function () {
      return value;
    };
    const setter = function (newValue: string) {
      if (newValue && newValue.length > max) {
        throw new Error(
          `Свойство ${propertyKey} не может быть длиннее ${max} символов`
        );
      }
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

// Декораторы для методов

/**
 * Декоратор для измерения времени выполнения метода
 */
export function Measure(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const finish = performance.now();
    console.log(`Метод ${propertyKey} выполнен за ${finish - start} мс`);
    return result;
  };

  return descriptor;
}

/**
 * Декоратор для кэширования результатов метода
 */
export function Cacheable(ttlSeconds: number = 60) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = `__cache_${propertyKey}`;
    const cacheTTLKey = `__cachettl_${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const cache = (this as any)[cacheKey];
      const now = Date.now();

      if (cache && (this as any)[cacheTTLKey] > now) {
        console.log(`Использование кэша для метода ${propertyKey}`);
        return cache;
      }

      const result = originalMethod.apply(this, args);
      (this as any)[cacheKey] = result;
      (this as any)[cacheTTLKey] = now + ttlSeconds * 1000;

      return result;
    };

    return descriptor;
  };
}

// Декораторы для параметров методов

/**
 * Декоратор для валидации параметра метода
 */
export function Validate(validator: (value: any) => boolean) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const originalMethod = target[propertyKey];

    target[propertyKey] = function (...args: any[]) {
      const paramValue = args[parameterIndex];

      if (!validator(paramValue)) {
        throw new Error(
          `Параметр ${parameterIndex} метода ${propertyKey} не прошел валидацию`
        );
      }

      return originalMethod.apply(this, args);
    };
  };
}

/**
 * Декоратор для преобразования строковых параметров в верхний регистр
 */
export function Uppercase(
  target: Object,
  propertyKey: string,
  parameterIndex: number
) {
  const originalMethod = (target as any)[propertyKey];

  (target as any)[propertyKey] = function (...args: any[]) {
    if (typeof args[parameterIndex] === "string") {
      args[parameterIndex] = args[parameterIndex].toUpperCase();
    }
    return originalMethod.apply(this, args);
  };
}
