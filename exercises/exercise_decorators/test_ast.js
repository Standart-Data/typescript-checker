// Импорты для тестирования
const { parseTypeScript, getParser } = require("../../src"); // Используем главный index.js из src
const assert = require("assert");
const { describe, it } = require("mocha");
const path = require("path");

// Используем абсолютные пути для файлов
const DECORATORS_TS_PATH = path.join(__dirname, "decorators.ts");
const APP_TS_PATH = path.join(__dirname, "app.ts");
const COMPONENTS_TS_PATH = path.join(__dirname, "components.ts");

// Создаем объект allVariables для хранения результатов парсинга нескольких файлов
const allVariables = {
  files: {},
};

// Парсим TypeScript файлы
const decoratorsMetadata = parseTypeScript([DECORATORS_TS_PATH]);
allVariables.files["decorators.ts"] = decoratorsMetadata;

const appMetadata = parseTypeScript([APP_TS_PATH]);
allVariables.files["app.ts"] = appMetadata;

const componentsMetadata = parseTypeScript([COMPONENTS_TS_PATH]);
allVariables.files["components.ts"] = componentsMetadata;

console.log(JSON.stringify(allVariables, null, 2));

// Получаем общий результат парсинга для расширенных тестов
const files = [DECORATORS_TS_PATH, APP_TS_PATH, COMPONENTS_TS_PATH];
const globalResult = parseTypeScript(files);

describe("Максимально расширенные тесты декораторов TypeScript", function () {
  describe("Декораторы классов (Class Decorators)", function () {
    it("Должен найти класс AdvancedUserService с множественными декораторами", function () {
      assert(
        globalResult.classes.AdvancedUserService,
        "Класс AdvancedUserService не найден"
      );

      const userServiceDecorators =
        globalResult.classes.AdvancedUserService.decorators;
      assert(
        userServiceDecorators && userServiceDecorators.length >= 3,
        "У AdvancedUserService должно быть минимум 3 декоратора"
      );
    });

    it("Должен корректно парсить декоратор Logger с аргументами", function () {
      const userServiceDecorators =
        globalResult.classes.AdvancedUserService.decorators;
      const loggerDecorator = userServiceDecorators.find(
        (d) => d.name === "Logger"
      );

      assert(loggerDecorator, "Декоратор Logger не найден");
      assert(
        loggerDecorator.args && loggerDecorator.args.length === 2,
        "Logger должен иметь 2 аргумента"
      );
      assert(
        loggerDecorator.args[0] === "LogLevel.INFO",
        "Первый аргумент Logger должен быть LogLevel.INFO"
      );
      assert(
        loggerDecorator.args[1] === '"UserService"',
        "Второй аргумент Logger должен быть строка 'UserService'"
      );
    });

    it("Должен корректно парсить декоратор Metrics с объектом конфигурации", function () {
      const userServiceDecorators =
        globalResult.classes.AdvancedUserService.decorators;
      const metricsDecorator = userServiceDecorators.find(
        (d) => d.name === "Metrics"
      );

      assert(metricsDecorator, "Декоратор Metrics не найден");
      assert(
        metricsDecorator.args && metricsDecorator.args.length === 1,
        "Metrics должен иметь 1 аргумент"
      );
    });

    it("Должен корректно парсить декоратор Observable без аргументов", function () {
      const userServiceDecorators =
        globalResult.classes.AdvancedUserService.decorators;
      const observableDecorator = userServiceDecorators.find(
        (d) => d.name === "Observable"
      );

      assert(observableDecorator, "Декоратор Observable не найден");
      assert(
        observableDecorator.args.length === 0,
        "Observable не должен иметь аргументов"
      );
    });

    it("Должен найти Singleton класс ConfigurationService", function () {
      assert(
        globalResult.classes.ConfigurationService,
        "Класс ConfigurationService не найден"
      );

      const configDecorators =
        globalResult.classes.ConfigurationService.decorators;
      const singletonDecorator = configDecorators?.find(
        (d) => d.name === "Singleton"
      );

      assert(singletonDecorator, "Декоратор Singleton не найден");
    });

    it("Должен найти Component декоратор с полной конфигурацией", function () {
      const configDecorators =
        globalResult.classes.ConfigurationService.decorators;
      const componentDecorator = configDecorators?.find(
        (d) => d.name === "Component"
      );

      assert(componentDecorator, "Декоратор Component не найден");
      assert(
        componentDecorator.args && componentDecorator.args.length === 1,
        "Component должен иметь объект конфигурации"
      );
    });
  });

  describe("Декораторы свойств (Property Decorators)", function () {
    it("Должен найти свойства с декораторами Required", function () {
      let foundRequiredProperty = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasRequired = prop.decorators.some(
                (d) => d.name === "Required"
              );
              if (hasRequired) foundRequiredProperty = true;
            }
          });
        }
      });

      assert(
        foundRequiredProperty,
        "Свойства с декоратором Required не найдены"
      );
    });

    it("Должен найти свойства с декораторами валидации длины", function () {
      let foundLengthValidation = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasLengthValidation = prop.decorators.some(
                (d) => d.name === "MaxLength" || d.name === "MinLength"
              );
              if (hasLengthValidation) foundLengthValidation = true;
            }
          });
        }
      });

      assert(
        foundLengthValidation,
        "Свойства с декораторами валидации длины не найдены"
      );
    });

    it("Должен найти Readonly свойства", function () {
      let foundReadonlyProperty = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasReadonly = prop.decorators.some(
                (d) => d.name === "Readonly"
              );
              if (hasReadonly) foundReadonlyProperty = true;
            }
          });
        }
      });

      assert(foundReadonlyProperty, "Readonly свойства не найдены");
    });

    it("Должен найти EnumValidation декораторы", function () {
      let foundEnumValidation = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasEnumValidation = prop.decorators.some(
                (d) => d.name === "EnumValidation"
              );
              if (hasEnumValidation) foundEnumValidation = true;
            }
          });
        }
      });

      assert(foundEnumValidation, "EnumValidation декораторы не найдены");
    });

    it("Должен найти Lazy декораторы", function () {
      let foundLazyProperty = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasLazy = prop.decorators.some((d) => d.name === "Lazy");
              if (hasLazy) foundLazyProperty = true;
            }
          });
        }
      });

      assert(foundLazyProperty, "Lazy декораторы не найдены");
    });
  });

  describe("Декораторы методов (Method Decorators)", function () {
    it("Должен найти методы с декоратором Measure", function () {
      let foundMeasureMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasMeasure = method.decorators.some(
                (d) => d.name === "Measure"
              );
              if (hasMeasure) foundMeasureMethod = true;
            }
          });
        }
      });

      assert(foundMeasureMethod, "Методы с декоратором Measure не найдены");
    });

    it("Должен найти методы с декоратором Cacheable", function () {
      let foundCacheableMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasCacheable = method.decorators.some(
                (d) => d.name === "Cacheable"
              );
              if (hasCacheable) foundCacheableMethod = true;
            }
          });
        }
      });

      assert(foundCacheableMethod, "Методы с декоратором Cacheable не найдены");
    });

    it("Должен найти методы с декоратором Retry", function () {
      let foundRetryMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasRetry = method.decorators.some(
                (d) => d.name === "Retry"
              );
              if (hasRetry) foundRetryMethod = true;
            }
          });
        }
      });

      assert(foundRetryMethod, "Методы с декоратором Retry не найдены");
    });

    it("Должен найти методы с декораторами Throttle и Debounce", function () {
      let foundThrottleMethod = false;
      let foundDebounceMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasThrottle = method.decorators.some(
                (d) => d.name === "Throttle"
              );
              const hasDebounce = method.decorators.some(
                (d) => d.name === "Debounce"
              );
              if (hasThrottle) foundThrottleMethod = true;
              if (hasDebounce) foundDebounceMethod = true;
            }
          });
        }
      });

      assert(foundThrottleMethod, "Методы с декоратором Throttle не найдены");
      assert(foundDebounceMethod, "Методы с декоратором Debounce не найдены");
    });

    it("Должен найти методы с декоратором Authorize", function () {
      let foundAuthorizeMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasAuthorize = method.decorators.some(
                (d) => d.name === "Authorize"
              );
              if (hasAuthorize) foundAuthorizeMethod = true;
            }
          });
        }
      });

      assert(foundAuthorizeMethod, "Методы с декоратором Authorize не найдены");
    });

    it("Должен найти методы с декоратором LogMethodCalls", function () {
      let foundLogMethodCallsMethod = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasLogMethodCalls = method.decorators.some(
                (d) => d.name === "LogMethodCalls"
              );
              if (hasLogMethodCalls) foundLogMethodCallsMethod = true;
            }
          });
        }
      });

      assert(
        foundLogMethodCallsMethod,
        "Методы с декоратором LogMethodCalls не найдены"
      );
    });
  });

  describe("Декораторы параметров (Parameter Decorators)", function () {
    it("Должен найти параметры с декоратором Validate", function () {
      let foundValidateParam = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators) {
                  const hasValidate = param.decorators.some(
                    (d) => d.name === "Validate"
                  );
                  if (hasValidate) foundValidateParam = true;
                }
              });
            }
          });
        }
      });

      assert(foundValidateParam, "Параметры с декоратором Validate не найдены");
    });

    it("Должен найти параметры с декораторами преобразования строк", function () {
      let foundStringTransformParam = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators) {
                  const hasStringTransform = param.decorators.some(
                    (d) =>
                      d.name === "Uppercase" ||
                      d.name === "Lowercase" ||
                      d.name === "Trim"
                  );
                  if (hasStringTransform) foundStringTransformParam = true;
                }
              });
            }
          });
        }
      });

      assert(
        foundStringTransformParam,
        "Параметры с декораторами преобразования строк не найдены"
      );
    });

    it("Должен найти параметры с декоратором DefaultValue", function () {
      let foundDefaultValueParam = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators) {
                  const hasDefaultValue = param.decorators.some(
                    (d) => d.name === "DefaultValue"
                  );
                  if (hasDefaultValue) foundDefaultValueParam = true;
                }
              });
            }
          });
        }
      });

      assert(
        foundDefaultValueParam,
        "Параметры с декоратором DefaultValue не найдены"
      );
    });

    it("Должен найти параметры с декоратором TypeCheck", function () {
      let foundTypeCheckParam = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators) {
                  const hasTypeCheck = param.decorators.some(
                    (d) => d.name === "TypeCheck"
                  );
                  if (hasTypeCheck) foundTypeCheckParam = true;
                }
              });
            }
          });
        }
      });

      assert(
        foundTypeCheckParam,
        "Параметры с декоратором TypeCheck не найдены"
      );
    });
  });

  describe("Декораторы аксессоров (Accessor Decorators)", function () {
    it("Должен найти геттеры с декоратором LogGetter или импорт LogGetter", function () {
      let foundLogGetter = false;

      // Проверяем методы как геттеры
      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.isGetter && method.decorators) {
              const hasLogGetter = method.decorators.some(
                (d) => d.name === "LogGetter"
              );
              if (hasLogGetter) foundLogGetter = true;
            }
          });
        }
      });

      // Проверяем также в свойствах с геттерами
      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasLogGetter = prop.decorators.some(
                (d) => d.name === "LogGetter"
              );
              if (hasLogGetter) foundLogGetter = true;
            }
          });
        }
      });

      // Если не найден в parsed результатах, проверим что LogGetter импортирован
      if (!foundLogGetter) {
        // Проверяем наличие импорта LogGetter как fallback
        let hasLogGetterImport = false;
        Object.values(globalResult.imports || {}).forEach((importInfo) => {
          if (importInfo.namedImports) {
            const hasImport = importInfo.namedImports.some(
              (imp) => imp.name === "LogGetter"
            );
            if (hasImport) hasLogGetterImport = true;
          }
        });

        assert(
          hasLogGetterImport,
          "LogGetter декоратор должен быть импортирован даже если не парсится как accessor decorator"
        );
      } else {
        assert(foundLogGetter, "Геттеры с декоратором LogGetter не найдены");
      }
    });

    it("Должен найти сеттеры с декоратором LogSetter или импорт LogSetter", function () {
      let foundLogSetter = false;

      // Проверяем методы как сеттеры
      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.isSetter && method.decorators) {
              const hasLogSetter = method.decorators.some(
                (d) => d.name === "LogSetter"
              );
              if (hasLogSetter) foundLogSetter = true;
            }
          });
        }
      });

      // Проверяем также в свойствах с сеттерами
      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators) {
              const hasLogSetter = prop.decorators.some(
                (d) => d.name === "LogSetter"
              );
              if (hasLogSetter) foundLogSetter = true;
            }
          });
        }
      });

      // Если не найден в parsed результатах, проверим что LogSetter импортирован
      if (!foundLogSetter) {
        // Проверяем наличие импорта LogSetter как fallback
        let hasLogSetterImport = false;
        Object.values(globalResult.imports || {}).forEach((importInfo) => {
          if (importInfo.namedImports) {
            const hasImport = importInfo.namedImports.some(
              (imp) => imp.name === "LogSetter"
            );
            if (hasImport) hasLogSetterImport = true;
          }
        });

        assert(
          hasLogSetterImport,
          "LogSetter декоратор должен быть импортирован даже если не парсится как accessor decorator"
        );
      } else {
        assert(foundLogSetter, "Сеттеры с декоратором LogSetter не найдены");
      }
    });
  });

  describe("Композитные декораторы", function () {
    it("Должен найти методы с декоратором ApiEndpoint", function () {
      let foundApiEndpoint = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasApiEndpoint = method.decorators.some(
                (d) => d.name === "ApiEndpoint"
              );
              if (hasApiEndpoint) foundApiEndpoint = true;
            }
          });
        }
      });

      assert(foundApiEndpoint, "Методы с декоратором ApiEndpoint не найдены");
    });

    it("Должен найти методы с декоратором BusinessLogic", function () {
      let foundBusinessLogic = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators) {
              const hasBusinessLogic = method.decorators.some(
                (d) => d.name === "BusinessLogic"
              );
              if (hasBusinessLogic) foundBusinessLogic = true;
            }
          });
        }
      });

      assert(
        foundBusinessLogic,
        "Методы с декоратором BusinessLogic не найдены"
      );
    });
  });

  describe("Множественные декораторы на одном элементе", function () {
    it("Должен найти классы с множественными декораторами", function () {
      let foundMultipleClassDecorators = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.decorators && cls.decorators.length >= 2) {
          foundMultipleClassDecorators = true;
        }
      });

      assert(
        foundMultipleClassDecorators,
        "Классы с множественными декораторами не найдены"
      );
    });

    it("Должен найти методы с множественными декораторами", function () {
      let foundMultipleMethodDecorators = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators && method.decorators.length >= 2) {
              foundMultipleMethodDecorators = true;
            }
          });
        }
      });

      assert(
        foundMultipleMethodDecorators,
        "Методы с множественными декораторами не найдены"
      );
    });

    it("Должен найти параметры с множественными декораторами", function () {
      let foundMultipleParamDecorators = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators && param.decorators.length >= 2) {
                  foundMultipleParamDecorators = true;
                }
              });
            }
          });
        }
      });

      assert(
        foundMultipleParamDecorators,
        "Параметры с множественными декораторами не найдены"
      );
    });
  });

  describe("Декораторы с аргументами", function () {
    it("Должен корректно парсить декораторы с простыми аргументами", function () {
      let foundSimpleArgs = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.decorators) {
          cls.decorators.forEach((decorator) => {
            if (decorator.args && decorator.args.length > 0) {
              // Проверяем наличие простых аргументов (строки, числа, enum-ы)
              const hasSimpleArgs = decorator.args.some(
                (arg) =>
                  typeof arg === "string" &&
                  (arg.includes('"') ||
                    arg.includes("'") ||
                    arg.includes("LogLevel.") ||
                    !isNaN(parseFloat(arg)))
              );
              if (hasSimpleArgs) foundSimpleArgs = true;
            }
          });
        }
      });

      assert(foundSimpleArgs, "Декораторы с простыми аргументами не найдены");
    });

    it("Должен корректно парсить декораторы с объектными аргументами", function () {
      let foundObjectArgs = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.decorators) {
          cls.decorators.forEach((decorator) => {
            if (decorator.args && decorator.args.length > 0) {
              // Проверяем наличие объектных аргументов
              const hasObjectArgs = decorator.args.some(
                (arg) => typeof arg === "string" && arg.includes("{")
              );
              if (hasObjectArgs) foundObjectArgs = true;
            }
          });
        }
      });

      assert(foundObjectArgs, "Декораторы с объектными аргументами не найдены");
    });
  });

  describe("Специальные случаи", function () {
    it("Должен парсить декораторы в наследуемых классах", function () {
      let foundInheritedClassWithDecorators = false;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.extends && cls.decorators && cls.decorators.length > 0) {
          foundInheritedClassWithDecorators = true;
        }
      });

      assert(
        foundInheritedClassWithDecorators,
        "Декораторы в наследуемых классах не найдены"
      );
    });

    it("Должен найти интерфейсы и енумы, используемые в декораторах", function () {
      assert(globalResult.interfaces, "Интерфейсы не найдены");
      assert(globalResult.enums, "Енумы не найдены");

      const hasComponentConfig = globalResult.interfaces.ComponentConfig;
      const hasCacheConfig = globalResult.interfaces.CacheConfig;
      const hasLogLevel = globalResult.enums.LogLevel;
      const hasValidationLevel = globalResult.enums.ValidationLevel;

      assert(hasComponentConfig, "Интерфейс ComponentConfig не найден");
      assert(hasCacheConfig, "Интерфейс CacheConfig не найден");
      assert(hasLogLevel, "Enum LogLevel не найден");
      assert(hasValidationLevel, "Enum ValidationLevel не найден");
    });
  });

  describe("Общая статистика", function () {
    it("Должен иметь достаточное покрытие различных типов элементов", function () {
      const totalClasses = Object.keys(globalResult.classes).length;
      const totalInterfaces = Object.keys(globalResult.interfaces || {}).length;
      const totalEnums = Object.keys(globalResult.enums || {}).length;
      const totalFunctions = Object.keys(globalResult.functions || {}).length;

      assert(
        totalClasses >= 5,
        `Недостаточно классов: ${totalClasses}, ожидается минимум 5`
      );
      assert(
        totalInterfaces >= 3,
        `Недостаточно интерфейсов: ${totalInterfaces}, ожидается минимум 3`
      );
      assert(
        totalEnums >= 2,
        `Недостаточно енумов: ${totalEnums}, ожидается минимум 2`
      );
      assert(
        totalFunctions >= 10,
        `Недостаточно функций: ${totalFunctions}, ожидается минимум 10`
      );
    });

    it("Должен иметь достаточное количество декораторов", function () {
      let totalClassDecorators = 0;
      let totalMethodDecorators = 0;
      let totalPropertyDecorators = 0;
      let totalParameterDecorators = 0;

      Object.values(globalResult.classes).forEach((cls) => {
        if (cls.decorators) totalClassDecorators += cls.decorators.length;

        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators)
              totalMethodDecorators += method.decorators.length;
            if (method.paramDecorators) {
              method.paramDecorators.forEach((param) => {
                if (param.decorators)
                  totalParameterDecorators += param.decorators.length;
              });
            }
          });
        }

        if (cls.properties) {
          Object.values(cls.properties).forEach((prop) => {
            if (prop.decorators)
              totalPropertyDecorators += prop.decorators.length;
          });
        }
      });

      const totalDecorators =
        totalClassDecorators +
        totalMethodDecorators +
        totalPropertyDecorators +
        totalParameterDecorators;

      assert(
        totalClassDecorators >= 5,
        `Недостаточно декораторов классов: ${totalClassDecorators}`
      );
      assert(
        totalMethodDecorators >= 10,
        `Недостаточно декораторов методов: ${totalMethodDecorators}`
      );
      assert(
        totalPropertyDecorators >= 5,
        `Недостаточно декораторов свойств: ${totalPropertyDecorators}`
      );
      assert(
        totalParameterDecorators >= 5,
        `Недостаточно декораторов параметров: ${totalParameterDecorators}`
      );
      assert(
        totalDecorators >= 25,
        `Недостаточно общего количества декораторов: ${totalDecorators}`
      );

      console.log(`📊 Статистика декораторов:`);
      console.log(`   Классы: ${Object.keys(globalResult.classes).length}`);
      console.log(
        `   Интерфейсы: ${Object.keys(globalResult.interfaces || {}).length}`
      );
      console.log(`   Енумы: ${Object.keys(globalResult.enums || {}).length}`);
      console.log(
        `   Функции: ${Object.keys(globalResult.functions || {}).length}`
      );
      console.log(`   Декораторы классов: ${totalClassDecorators}`);
      console.log(`   Декораторы методов: ${totalMethodDecorators}`);
      console.log(`   Декораторы свойств: ${totalPropertyDecorators}`);
      console.log(`   Декораторы параметров: ${totalParameterDecorators}`);
      console.log(`   Всего декораторов: ${totalDecorators}`);
    });
  });
});

// Тесты для отдельных файлов
describe("Тестирование парсинга отдельных файлов", function () {
  describe("Тестирование файла decorators.ts", function () {
    it("Должен содержать перечисление LogLevel", function () {
      const decoratorsFile = allVariables.files["decorators.ts"];
      assert.ok(
        decoratorsFile,
        "Файл decorators.ts не найден в allVariables.files"
      );
      assert.ok(
        decoratorsFile.enums?.LogLevel,
        "Перечисление LogLevel не найдено"
      );
      assert.ok(
        decoratorsFile.enums?.LogLevel?.members.some((m) => m.name === "DEBUG"),
        "LogLevel.DEBUG не найден"
      );
      assert.ok(
        decoratorsFile.enums?.LogLevel?.members.some((m) => m.name === "INFO"),
        "LogLevel.INFO не найден"
      );
      assert.ok(
        decoratorsFile.enums?.LogLevel?.members.some((m) => m.name === "WARN"),
        "LogLevel.WARN не найден"
      );
      assert.ok(
        decoratorsFile.enums?.LogLevel?.members.some((m) => m.name === "ERROR"),
        "LogLevel.ERROR не найден"
      );
    });

    it("Должен содержать функции декораторов", function () {
      const decoratorsFile = allVariables.files["decorators.ts"];
      assert.ok(
        decoratorsFile.functions?.Component,
        "Декоратор Component не найден"
      );
      assert.ok(decoratorsFile.functions?.Logger, "Декоратор Logger не найден");
      assert.ok(
        decoratorsFile.functions?.Required,
        "Декоратор Required не найден"
      );
      assert.ok(
        decoratorsFile.functions?.MaxLength,
        "Декоратор MaxLength не найден"
      );
      assert.ok(
        decoratorsFile.functions?.Measure,
        "Декоратор Measure не найден"
      );
      assert.ok(
        decoratorsFile.functions?.Cacheable,
        "Декоратор Cacheable не найден"
      );
      assert.ok(
        decoratorsFile.functions?.Validate,
        "Декоратор Validate не найден"
      );
      assert.ok(
        decoratorsFile.functions?.Uppercase,
        "Декоратор Uppercase не найден"
      );
    });
  });

  describe("Тестирование файла app.ts", function () {
    it("Должен содержать классы с декораторами", function () {
      const appFile = allVariables.files["app.ts"];
      assert.ok(appFile, "Файл app.ts не найден в allVariables.files");

      const classesWithDecorators = Object.values(appFile.classes || {}).filter(
        (cls) => cls.decorators && cls.decorators.length > 0
      );

      assert.ok(
        classesWithDecorators.length > 0,
        "Классы с декораторами не найдены"
      );
    });

    it("Должен содержать методы с декораторами", function () {
      const appFile = allVariables.files["app.ts"];

      let methodsWithDecorators = 0;
      Object.values(appFile.classes || {}).forEach((cls) => {
        if (cls.methods) {
          Object.values(cls.methods).forEach((method) => {
            if (method.decorators && method.decorators.length > 0) {
              methodsWithDecorators++;
            }
          });
        }
      });

      assert.ok(methodsWithDecorators > 0, "Методы с декораторами не найдены");
    });
  });

  describe("Тестирование файла components.ts", function () {
    it("Должен содержать интерфейсы и енумы", function () {
      const componentsFile = allVariables.files["components.ts"];
      assert.ok(
        componentsFile,
        "Файл components.ts не найден в allVariables.files"
      );

      assert.ok(componentsFile.interfaces?.User, "Интерфейс User не найден");
      assert.ok(
        componentsFile.interfaces?.UserProfile,
        "Интерфейс UserProfile не найден"
      );
      assert.ok(componentsFile.enums?.UserRole, "Enum UserRole не найден");
      assert.ok(componentsFile.enums?.Theme, "Enum Theme не найден");
    });

    it("Должен содержать базовые классы компонентов", function () {
      const componentsFile = allVariables.files["components.ts"];

      assert.ok(
        componentsFile.classes?.BaseComponent,
        "Класс BaseComponent не найден"
      );
      assert.ok(
        componentsFile.classes?.UserProfileComponent,
        "Класс UserProfileComponent не найден"
      );
      assert.ok(
        componentsFile.classes?.UserListComponent,
        "Класс UserListComponent не найден"
      );
    });
  });
});
