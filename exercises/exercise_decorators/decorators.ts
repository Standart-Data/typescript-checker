// Максимально расширенный файл с декораторами для TypeScript

// Определения типов декораторов
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export enum ValidationLevel {
  STRICT = "strict",
  MODERATE = "moderate",
  LOOSE = "loose",
}

// Интерфейсы для конфигурации декораторов
export interface ComponentConfig {
  selector: string;
  template?: string;
  styleUrls?: string[];
  providers?: any[];
  inputs?: string[];
  outputs?: string[];
}

export interface CacheConfig {
  ttl: number;
  strategy?: "memory" | "redis" | "localStorage";
  maxSize?: number;
}

export interface ValidationConfig {
  level: ValidationLevel;
  customMessage?: string;
  throwOnError?: boolean;
}

export interface MetricsConfig {
  trackTime?: boolean;
  trackMemory?: boolean;
  trackCalls?: boolean;
  reportingInterval?: number;
}

// ===========================================
// ДЕКОРАТОРЫ КЛАССОВ (Class Decorators)
// ===========================================

/**
 * Простой декоратор компонента
 */
export function Component(config: ComponentConfig) {
  console.log(`Создание компонента с селектором ${config.selector}`);
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      selector = config.selector;
      template = config.template || "";
      styleUrls = config.styleUrls || [];
      providers = config.providers || [];
      inputs = config.inputs || [];
      outputs = config.outputs || [];

      getComponentInfo() {
        return `Компонент: ${config.selector}, шаблон: ${this.template}`;
      }
    };
  };
}

/**
 * Декоратор для логгирования класса с расширенной конфигурацией
 */
export function Logger(level: LogLevel = LogLevel.INFO, prefix?: string) {
  return function (target: any) {
    const className = target.name;
    const logPrefix = prefix || className;

    console.log(`Логгирование класса ${className} с уровнем ${level}`);

    // Добавляем методы логирования в прототип класса
    target.prototype.log = function (
      message: string,
      logLevel: LogLevel = level
    ) {
      console.log(`[${logLevel}][${logPrefix}] ${message}`);
    };

    target.prototype.logError = function (error: Error) {
      console.error(`[ERROR][${logPrefix}] ${error.message}`, error.stack);
    };

    target.prototype.logPerformance = function (
      operation: string,
      startTime: number
    ) {
      const endTime = performance.now();
      console.log(
        `[PERF][${logPrefix}] ${operation}: ${endTime - startTime}ms`
      );
    };
  };
}

/**
 * Декоратор для создания Singleton класса
 */
export function Singleton<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  console.log(`Применение Singleton к классу ${constructor.name}`);

  let instance: T;
  const singletonClass = class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance as any;
      }
      super(...args);
      instance = this as any;
    }

    static getInstance(...args: any[]): T {
      if (!instance) {
        instance = new singletonClass(...args) as any;
      }
      return instance;
    }
  };

  return singletonClass;
}

/**
 * Декоратор для создания Observable класса
 */
export function Observable(target: any) {
  console.log(`Добавление Observable функциональности к классу ${target.name}`);

  target.prototype._observers = [];

  target.prototype.subscribe = function (callback: Function) {
    this._observers.push(callback);
    return () => {
      const index = this._observers.indexOf(callback);
      if (index > -1) {
        this._observers.splice(index, 1);
      }
    };
  };

  target.prototype.notify = function (data: any) {
    this._observers.forEach((callback: Function) => callback(data));
  };
}

/**
 * Декоратор для добавления метрик к классу
 */
export function Metrics(config: MetricsConfig = {}) {
  return function (target: any) {
    console.log(`Добавление метрик к классу ${target.name}`);

    target.prototype._metrics = {
      calls: new Map(),
      startTimes: new Map(),
      memoryUsage: [],
    };

    target.prototype.getMetrics = function () {
      return {
        calls: Object.fromEntries(this._metrics.calls),
        averageMemory:
          this._metrics.memoryUsage.reduce((a: number, b: number) => a + b, 0) /
            this._metrics.memoryUsage.length || 0,
        totalMethods: this._metrics.calls.size,
      };
    };

    target.prototype.resetMetrics = function () {
      this._metrics.calls.clear();
      this._metrics.startTimes.clear();
      this._metrics.memoryUsage = [];
    };
  };
}

// ===========================================
// ДЕКОРАТОРЫ СВОЙСТВ (Property Decorators)
// ===========================================

/**
 * Декоратор для обязательного свойства
 */
export function Required(target: any, propertyKey: string) {
  console.log(`Свойство ${propertyKey} помечено как обязательное`);

  let value: any;
  const getter = function () {
    if (value === undefined || value === null) {
      throw new Error(`Свойство ${propertyKey} обязательно для заполнения`);
    }
    return value;
  };
  const setter = function (newValue: any) {
    if (newValue === undefined || newValue === null) {
      throw new Error(`Свойство ${propertyKey} не может быть пустым`);
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
export function MaxLength(max: number, customMessage?: string) {
  return function (target: any, propertyKey: string) {
    const message =
      customMessage ||
      `Свойство ${propertyKey} не может быть длиннее ${max} символов`;
    console.log(
      `Установлена максимальная длина ${max} для свойства ${propertyKey}`
    );

    let value: string;
    const getter = function () {
      return value;
    };
    const setter = function (newValue: string) {
      if (newValue && newValue.length > max) {
        throw new Error(message);
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

/**
 * Декоратор для проверки минимальной длины
 */
export function MinLength(min: number) {
  return function (target: any, propertyKey: string) {
    console.log(
      `Установлена минимальная длина ${min} для свойства ${propertyKey}`
    );

    let value: string;
    const getter = function () {
      return value;
    };
    const setter = function (newValue: string) {
      if (newValue && newValue.length < min) {
        throw new Error(
          `Свойство ${propertyKey} должно быть не менее ${min} символов`
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

/**
 * Декоратор для readonly свойства
 */
export function Readonly(target: any, propertyKey: string) {
  console.log(`Свойство ${propertyKey} помечено как readonly`);

  let value: any;
  let hasBeenSet = false;

  const getter = function () {
    return value;
  };
  const setter = function (newValue: any) {
    if (hasBeenSet) {
      throw new Error(`Свойство ${propertyKey} доступно только для чтения`);
    }
    value = newValue;
    hasBeenSet = true;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

/**
 * Декоратор для enum validation
 */
export function EnumValidation<
  T extends Record<string | number, string | number>
>(enumObject: T) {
  return function (target: any, propertyKey: string) {
    console.log(`Валидация enum для свойства ${propertyKey}`);

    let value: any;
    const validValues = Object.values(enumObject as any);

    const getter = function () {
      return value;
    };
    const setter = function (newValue: any) {
      if (
        newValue !== undefined &&
        newValue !== null &&
        !validValues.includes(newValue)
      ) {
        throw new Error(
          `Свойство ${propertyKey} должно быть одним из: ${validValues.join(
            ", "
          )}`
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

/**
 * Декоратор для lazy loading свойства
 */
export function Lazy(initializer: () => any) {
  return function (target: any, propertyKey: string) {
    console.log(`Lazy loading для свойства ${propertyKey}`);

    let value: any;
    let hasValue = false;

    const getter = function () {
      if (!hasValue) {
        value = initializer();
        hasValue = true;
      }
      return value;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      enumerable: true,
      configurable: true,
    });
  };
}

// ===========================================
// ДЕКОРАТОРЫ МЕТОДОВ (Method Decorators)
// ===========================================

/**
 * Декоратор для измерения времени выполнения метода
 */
export function Measure(logResults: boolean = true) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const finish = performance.now();
      const duration = finish - start;

      if (logResults) {
        console.log(`Метод ${propertyKey} выполнен за ${duration} мс`);
      }

      // Сохраняем метрики если класс поддерживает их
      if ((this as any)._metrics) {
        const calls = (this as any)._metrics.calls.get(propertyKey) || 0;
        (this as any)._metrics.calls.set(propertyKey, calls + 1);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Расширенный декоратор для кэширования результатов метода
 */
export function Cacheable(config: CacheConfig | number = 60) {
  const cacheConfig: CacheConfig =
    typeof config === "number"
      ? { ttl: config, strategy: "memory", maxSize: 100 }
      : { strategy: "memory", maxSize: 100, ...config };

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheKey = `__cache_${propertyKey}`;
    const cacheTTLKey = `__cachettl_${propertyKey}`;
    const cacheKeysKey = `__cachekeys_${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const argKey = JSON.stringify(args);
      const cache = (this as any)[cacheKey] || {};
      const cacheTTL = (this as any)[cacheTTLKey] || {};
      const cacheKeys = (this as any)[cacheKeysKey] || new Set();
      const now = Date.now();

      // Проверяем наличие кэша и его актуальность
      if (cache[argKey] && cacheTTL[argKey] > now) {
        console.log(
          `Использование кэша для метода ${propertyKey} с аргументами: ${argKey}`
        );
        return cache[argKey];
      }

      // Очищаем устаревший кэш
      if (cache[argKey] && cacheTTL[argKey] <= now) {
        delete cache[argKey];
        delete cacheTTL[argKey];
        cacheKeys.delete(argKey);
      }

      // Проверяем лимит размера кэша
      if (cacheConfig.maxSize && cacheKeys.size >= cacheConfig.maxSize) {
        const oldestKey = cacheKeys.values().next().value;
        delete cache[oldestKey];
        delete cacheTTL[oldestKey];
        cacheKeys.delete(oldestKey);
      }

      const result = originalMethod.apply(this, args);

      // Сохраняем результат в кэш
      cache[argKey] = result;
      cacheTTL[argKey] = now + cacheConfig.ttl * 1000;
      cacheKeys.add(argKey);

      (this as any)[cacheKey] = cache;
      (this as any)[cacheTTLKey] = cacheTTL;
      (this as any)[cacheKeysKey] = cacheKeys;

      return result;
    };

    return descriptor;
  };
}

/**
 * Декоратор для повторных попыток выполнения метода
 */
export function Retry(maxAttempts: number = 3, delay: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Попытка ${attempt} выполнения метода ${propertyKey}`);
          return await originalMethod.apply(this, args);
        } catch (error: any) {
          lastError = error;
          console.warn(`Попытка ${attempt} неудачна: ${error.message}`);

          if (attempt < maxAttempts) {
            await new Promise((resolve) =>
              setTimeout(resolve, delay * attempt)
            );
          }
        }
      }

      throw new Error(
        `Метод ${propertyKey} завершился неудачно после ${maxAttempts} попыток. Последняя ошибка: ${lastError.message}`
      );
    };

    return descriptor;
  };
}

/**
 * Декоратор для ограничения частоты вызовов (throttling)
 */
export function Throttle(intervalMs: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const throttleKey = `__throttle_${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      const now = Date.now();
      const lastCall = (this as any)[throttleKey] || 0;

      if (now - lastCall < intervalMs) {
        console.log(
          `Метод ${propertyKey} заблокирован throttling (осталось ${
            intervalMs - (now - lastCall)
          }ms)`
        );
        return;
      }

      (this as any)[throttleKey] = now;
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Декоратор для debouncing метода
 */
export function Debounce(delayMs: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const timeoutKey = `__debounce_${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      clearTimeout((this as any)[timeoutKey]);

      (this as any)[timeoutKey] = setTimeout(() => {
        console.log(`Выполнение debounced метода ${propertyKey}`);
        originalMethod.apply(this, args);
      }, delayMs);
    };

    return descriptor;
  };
}

/**
 * Декоратор для проверки прав доступа
 */
export function Authorize(roles: string[] | string) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Предполагаем, что у объекта есть свойство userRoles или getCurrentUserRoles()
      const userRoles =
        (this as any).userRoles ||
        ((this as any).getCurrentUserRoles &&
          (this as any).getCurrentUserRoles()) ||
        [];

      const hasPermission = requiredRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasPermission) {
        throw new Error(
          `Доступ запрещен. Требуются роли: ${requiredRoles.join(", ")}`
        );
      }

      console.log(`Авторизация прошла успешно для метода ${propertyKey}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Декоратор для логгирования входа и выхода из метода
 */
export function LogMethodCalls(logLevel: LogLevel = LogLevel.DEBUG) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(
        `[${logLevel}] Вход в метод ${propertyKey} с аргументами:`,
        args
      );

      try {
        const result = originalMethod.apply(this, args);
        console.log(
          `[${logLevel}] Выход из метода ${propertyKey} с результатом:`,
          result
        );
        return result;
      } catch (error) {
        console.error(`[${logLevel}] Ошибка в методе ${propertyKey}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// ===========================================
// ДЕКОРАТОРЫ ПАРАМЕТРОВ (Parameter Decorators)
// ===========================================

/**
 * Декоратор для валидации параметра метода
 */
export function Validate(
  validator: (value: any) => boolean,
  customMessage?: string
) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingMetadata =
      Reflect.getMetadata("validators", target, propertyKey) || [];
    existingMetadata.push({ index: parameterIndex, validator, customMessage });
    Reflect.defineMetadata("validators", existingMetadata, target, propertyKey);

    const originalMethod = target[propertyKey];

    target[propertyKey] = function (...args: any[]) {
      const validators =
        Reflect.getMetadata("validators", target, propertyKey) || [];

      validators.forEach(({ index, validator, customMessage }: any) => {
        const paramValue = args[index];
        if (!validator(paramValue)) {
          const message =
            customMessage ||
            `Параметр ${index} метода ${propertyKey} не прошел валидацию`;
          throw new Error(message);
        }
      });

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
      console.log(
        `Преобразование параметра ${parameterIndex} метода ${propertyKey} в верхний регистр`
      );
      args[parameterIndex] = args[parameterIndex].toUpperCase();
    }
    return originalMethod.apply(this, args);
  };
}

/**
 * Декоратор для преобразования в нижний регистр
 */
export function Lowercase(
  target: Object,
  propertyKey: string,
  parameterIndex: number
) {
  const originalMethod = (target as any)[propertyKey];

  (target as any)[propertyKey] = function (...args: any[]) {
    if (typeof args[parameterIndex] === "string") {
      console.log(
        `Преобразование параметра ${parameterIndex} метода ${propertyKey} в нижний регистр`
      );
      args[parameterIndex] = args[parameterIndex].toLowerCase();
    }
    return originalMethod.apply(this, args);
  };
}

/**
 * Декоратор для trim строковых параметров
 */
export function Trim(
  target: Object,
  propertyKey: string,
  parameterIndex: number
) {
  const originalMethod = (target as any)[propertyKey];

  (target as any)[propertyKey] = function (...args: any[]) {
    if (typeof args[parameterIndex] === "string") {
      console.log(`Trim параметра ${parameterIndex} метода ${propertyKey}`);
      args[parameterIndex] = args[parameterIndex].trim();
    }
    return originalMethod.apply(this, args);
  };
}

/**
 * Декоратор для установки значения по умолчанию
 */
export function DefaultValue(defaultValue: any) {
  return function (
    target: Object,
    propertyKey: string,
    parameterIndex: number
  ) {
    const originalMethod = (target as any)[propertyKey];

    (target as any)[propertyKey] = function (...args: any[]) {
      if (args[parameterIndex] === undefined || args[parameterIndex] === null) {
        console.log(
          `Установка значения по умолчанию для параметра ${parameterIndex} метода ${propertyKey}`
        );
        args[parameterIndex] = defaultValue;
      }
      return originalMethod.apply(this, args);
    };
  };
}

/**
 * Декоратор для проверки типа параметра
 */
export function TypeCheck(expectedType: string) {
  return function (
    target: Object,
    propertyKey: string,
    parameterIndex: number
  ) {
    const originalMethod = (target as any)[propertyKey];

    (target as any)[propertyKey] = function (...args: any[]) {
      const actualType = typeof args[parameterIndex];
      if (actualType !== expectedType) {
        throw new Error(
          `Параметр ${parameterIndex} метода ${propertyKey} должен быть типа ${expectedType}, получен ${actualType}`
        );
      }
      return originalMethod.apply(this, args);
    };
  };
}

// ===========================================
// ДЕКОРАТОРЫ АКСЕССОРОВ (Accessor Decorators)
// ===========================================

/**
 * Декоратор для логгирования доступа к геттеру
 */
export function LogGetter(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalGetter = descriptor.get;

  if (originalGetter) {
    descriptor.get = function () {
      console.log(`Доступ к геттеру ${propertyKey}`);
      return originalGetter.call(this);
    };
  }
}

/**
 * Декоратор для логгирования установки значения через сеттер
 */
export function LogSetter(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalSetter = descriptor.set;

  if (originalSetter) {
    descriptor.set = function (value: any) {
      console.log(`Установка значения ${value} через сеттер ${propertyKey}`);
      return originalSetter.call(this, value);
    };
  }
}

// ===========================================
// КОМПОЗИТНЫЕ И МНОЖЕСТВЕННЫЕ ДЕКОРАТОРЫ
// ===========================================

/**
 * Композитный декоратор для API endpoint
 */
export function ApiEndpoint(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Комбинируем несколько декораторов
    LogMethodCalls(LogLevel.INFO)(target, propertyKey, descriptor);
    Measure(true)(target, propertyKey, descriptor);

    // Добавляем метаданные для роутинга
    Reflect.defineMetadata("api:path", path, target, propertyKey);
    Reflect.defineMetadata("api:method", method, target, propertyKey);

    console.log(
      `Регистрация API endpoint: ${method} ${path} -> ${propertyKey}`
    );
  };
}

/**
 * Композитный декоратор для бизнес-логики
 */
export function BusinessLogic(
  config: { cache?: boolean; retry?: boolean; authorize?: string[] } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    if (config.cache) {
      Cacheable({ ttl: 300, strategy: "memory" })(
        target,
        propertyKey,
        descriptor
      );
    }

    if (config.retry) {
      Retry(3, 1000)(target, propertyKey, descriptor);
    }

    if (config.authorize) {
      Authorize(config.authorize)(target, propertyKey, descriptor);
    }

    LogMethodCalls(LogLevel.INFO)(target, propertyKey, descriptor);
    Measure(true)(target, propertyKey, descriptor);
  };
}

// Добавляем поддержку для reflect-metadata (если доступно)
declare global {
  namespace Reflect {
    function defineMetadata(
      metadataKey: any,
      metadataValue: any,
      target: any,
      propertyKey?: string | symbol
    ): void;
    function getMetadata(
      metadataKey: any,
      target: any,
      propertyKey?: string | symbol
    ): any;
  }
}

// Простая реализация Reflect.metadata если не доступна
if (typeof Reflect === "undefined" || !Reflect.defineMetadata) {
  (global as any).Reflect = (global as any).Reflect || {};
  const metadata = new WeakMap();

  (global as any).Reflect.defineMetadata = function (
    key: any,
    value: any,
    target: any,
    propertyKey?: string
  ) {
    const targetKey = propertyKey
      ? `${target.constructor.name}.${propertyKey}`
      : target.constructor.name;
    if (!metadata.has(target)) {
      metadata.set(target, new Map());
    }
    metadata.get(target).set(`${key}:${targetKey}`, value);
  };

  (global as any).Reflect.getMetadata = function (
    key: any,
    target: any,
    propertyKey?: string
  ) {
    const targetKey = propertyKey
      ? `${target.constructor.name}.${propertyKey}`
      : target.constructor.name;
    return metadata.has(target)
      ? metadata.get(target).get(`${key}:${targetKey}`)
      : undefined;
  };
}
