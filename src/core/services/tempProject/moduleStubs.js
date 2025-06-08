const fs = require("fs");
const path = require("path");
const { getStub } = require("./stubs");

/**
 * Список популярных модулей для создания заглушек
 */
const COMMON_MODULES = [
  "class-transformer",
  "class-validator",
  "reflect-metadata",
  "express",
  "lodash",
  "moment",
  "axios",
  "uuid",
  "classnames",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "react",
  "react-dom",
  "react-hook-form",
];

/**
 * Создает детальные типы для конкретного модуля
 * @param {string} moduleName - имя модуля
 * @returns {string} определения типов
 */
function createTypeDefinition(moduleName) {
  return getStub(moduleName);
}

/**
 * Создает подмодули для lodash (lodash/omit, lodash/pick и т.д.)
 * @param {string} lodashDir - путь к директории lodash
 */
function createLodashSubmodules(lodashDir) {
  const submodules = [
    "omit",
    "pick",
    "merge",
    "clone",
    "cloneDeep",
    "get",
    "set",
    "has",
    "keys",
    "values",
    "map",
    "filter",
    "reduce",
    "forEach",
    "find",
    "groupBy",
    "sortBy",
    "orderBy",
    "uniq",
    "flatten",
    "chunk",
    "compact",
    "difference",
    "intersection",
    "union",
    "without",
    "debounce",
    "throttle",
    "isEqual",
    "isEmpty",
    "isArray",
    "isObject",
    "isString",
    "isNumber",
    "camelCase",
    "kebabCase",
    "snakeCase",
    "capitalize",
    "trim",
  ];

  submodules.forEach((functionName) => {
    const submoduleDir = path.join(lodashDir, functionName);
    fs.mkdirSync(submoduleDir, { recursive: true });

    // Создаем package.json для подмодуля
    const submodulePackageJson = {
      name: `lodash/${functionName}`,
      version: "1.0.0",
      main: "./index.js",
      types: "./index.d.ts",
    };

    fs.writeFileSync(
      path.join(submoduleDir, "package.json"),
      JSON.stringify(submodulePackageJson, null, 2)
    );

    // Создаем типы для подмодуля
    const typeDefinition = createLodashFunctionStub(functionName);
    fs.writeFileSync(path.join(submoduleDir, "index.d.ts"), typeDefinition);

    // Создаем минимальный index.js
    const indexJs = `// lodash/${functionName} stub\nmodule.exports = function() { return arguments[0]; };`;
    fs.writeFileSync(path.join(submoduleDir, "index.js"), indexJs);
  });
}

/**
 * Создает подмодули для classnames
 * @param {string} classnamesDir - путь к директории classnames
 */
function createClassnamesSubmodules(classnamesDir) {
  const fs = require("fs");
  const path = require("path");

  const submodules = ["bind", "dedupe"];

  submodules.forEach((functionName) => {
    const submoduleDir = path.join(classnamesDir, functionName);
    fs.mkdirSync(submoduleDir, { recursive: true });

    // Создаем package.json для подмодуля
    const submodulePackageJson = {
      name: `classnames/${functionName}`,
      version: "1.0.0",
      main: "./index.js",
      types: "./index.d.ts",
    };

    fs.writeFileSync(
      path.join(submoduleDir, "package.json"),
      JSON.stringify(submodulePackageJson, null, 2)
    );

    // Создаем типы для подмодуля
    const typeDefinition = createClassnamesFunctionStub(functionName);
    fs.writeFileSync(path.join(submoduleDir, "index.d.ts"), typeDefinition);

    // Создаем минимальный index.js
    const indexJs = `// classnames/${functionName} stub\nmodule.exports = function() { return 'stub-class'; };`;
    fs.writeFileSync(path.join(submoduleDir, "index.js"), indexJs);
  });
}

/**
 * Создает типизацию для конкретной функции classnames
 * @param {string} functionName - имя функции
 * @returns {string} определение типов
 */
function createClassnamesFunctionStub(functionName) {
  const functionStubs = {
    bind: `
      import { ClassValue } from 'classnames';
      
      interface BoundClassNames {
        (...classes: ClassValue[]): string;
      }
      
      declare const bind: {
        (styles: Record<string, string>): BoundClassNames;
      };
      
      export default bind;`,
    dedupe: `export default function dedupe(...classes: any[]): string;`,
  };

  return (
    functionStubs[functionName] ||
    `export default function ${functionName}(...args: any[]): string;`
  );
}

/**
 * Создает типизацию для конкретной функции lodash
 * @param {string} functionName - имя функции
 * @returns {string} определение типов
 */
function createLodashFunctionStub(functionName) {
  const functionStubs = {
    omit: `export default function omit<T, K extends keyof T>(object: T, paths: (K | string)[]): Omit<T, K>;`,
    pick: `export default function pick<T, K extends keyof T>(object: T, ...paths: (K | string)[]): Pick<T, K>;`,
    merge: `export default function merge<T>(object: T, ...sources: any[]): T;`,
    clone: `export default function clone<T>(value: T): T;`,
    cloneDeep: `export default function cloneDeep<T>(value: T): T;`,
    get: `export default function get<T>(object: any, path: string | string[], defaultValue?: T): T;`,
    set: `export default function set<T>(object: T, path: string | string[], value: any): T;`,
    has: `export default function has(object: any, path: string | string[]): boolean;`,
    keys: `export default function keys<T>(object: T): string[];`,
    values: `export default function values<T>(object: T): any[];`,
    map: `export default function map<T, U>(collection: T[], iteratee: (value: T, index: number) => U): U[];`,
    filter: `export default function filter<T>(collection: T[], predicate: (value: T) => boolean): T[];`,
    reduce: `export default function reduce<T, U>(collection: T[], iteratee: (acc: U, value: T, index: number) => U, accumulator: U): U;`,
    forEach: `export default function forEach<T>(collection: T[], iteratee: (value: T, index: number) => void): T[];`,
    find: `export default function find<T>(collection: T[], predicate: (value: T) => boolean): T | undefined;`,
    groupBy: `export default function groupBy<T>(collection: T[], iteratee: string | ((value: T) => any)): { [key: string]: T[] };`,
    sortBy: `export default function sortBy<T>(collection: T[], iteratees: string | string[] | ((value: T) => any)[]): T[];`,
    orderBy: `export default function orderBy<T>(collection: T[], iteratees: string[], orders?: string[]): T[];`,
    uniq: `export default function uniq<T>(array: T[]): T[];`,
    flatten: `export default function flatten<T>(array: T[][] | T[]): T[];`,
    chunk: `export default function chunk<T>(array: T[], size?: number): T[][];`,
    compact: `export default function compact<T>(array: (T | null | undefined | false | "" | 0)[]): T[];`,
    difference: `export default function difference<T>(array: T[], ...values: T[][]): T[];`,
    intersection: `export default function intersection<T>(...arrays: T[][]): T[];`,
    union: `export default function union<T>(...arrays: T[][]): T[];`,
    without: `export default function without<T>(array: T[], ...values: T[]): T[];`,
    debounce: `export default function debounce<T extends (...args: any[]) => any>(func: T, wait?: number, options?: { leading?: boolean; maxWait?: number; trailing?: boolean }): T & { cancel(): void; flush(): any };`,
    throttle: `export default function throttle<T extends (...args: any[]) => any>(func: T, wait?: number, options?: { leading?: boolean; trailing?: boolean }): T & { cancel(): void; flush(): any };`,
    isEqual: `export default function isEqual(value: any, other: any): boolean;`,
    isEmpty: `export default function isEmpty(value: any): boolean;`,
    isArray: `export default function isArray(value: any): value is any[];`,
    isObject: `export default function isObject(value: any): value is object;`,
    isString: `export default function isString(value: any): value is string;`,
    isNumber: `export default function isNumber(value: any): value is number;`,
    camelCase: `export default function camelCase(string?: string): string;`,
    kebabCase: `export default function kebabCase(string?: string): string;`,
    snakeCase: `export default function snakeCase(string?: string): string;`,
    capitalize: `export default function capitalize(string?: string): string;`,
    trim: `export default function trim(string?: string, chars?: string): string;`,
  };

  return (
    functionStubs[functionName] ||
    `export default function ${functionName}(...args: any[]): any;`
  );
}

/**
 * Создает заглушки модулей в node_modules
 * @param {string} nodeModulesDir - путь к директории node_modules
 */
function createModuleStubs(nodeModulesDir) {
  const typesDir = path.join(nodeModulesDir, "@types");
  fs.mkdirSync(typesDir, { recursive: true });

  COMMON_MODULES.forEach((moduleName) => {
    const moduleDir = path.join(nodeModulesDir, moduleName);
    fs.mkdirSync(moduleDir, { recursive: true });

    // Создаем детальный package.json для каждого модуля
    const modulePackageJson = {
      name: moduleName,
      version: "1.0.0",
      main: "./index.js",
      types: "./index.d.ts",
      typings: "./index.d.ts",
      exports: {
        ".": {
          types: "./index.d.ts",
          import: "./index.mjs",
          require: "./index.js",
        },
      },
    };

    fs.writeFileSync(
      path.join(moduleDir, "package.json"),
      JSON.stringify(modulePackageJson, null, 2)
    );

    // Создаем типы
    const typeDefinition = createTypeDefinition(moduleName);
    fs.writeFileSync(path.join(moduleDir, "index.d.ts"), typeDefinition);

    // Создаем минимальный index.js
    const indexJs = `// ${moduleName} stub\nmodule.exports = {};`;
    fs.writeFileSync(path.join(moduleDir, "index.js"), indexJs);

    // Создаем index.mjs для ES modules
    const indexMjs = `// ${moduleName} ES module stub\nexport default {};`;
    fs.writeFileSync(path.join(moduleDir, "index.mjs"), indexMjs);

    // Создаем подмодули для lodash (точечные импорты)
    if (moduleName === "lodash") {
      createLodashSubmodules(moduleDir);
    }

    // Создаем подмодули для classnames (точечные импорты)
    if (moduleName === "classnames") {
      createClassnamesSubmodules(moduleDir);
    }

    // Также создаем типы в @types директории для лучшего разрешения
    if (!moduleName.startsWith("@types/")) {
      const typesModuleDir = path.join(typesDir, moduleName);
      fs.mkdirSync(typesModuleDir, { recursive: true });

      fs.writeFileSync(
        path.join(typesModuleDir, "package.json"),
        JSON.stringify(
          {
            name: `@types/${moduleName}`,
            version: "1.0.0",
            types: "index.d.ts",
            typings: "index.d.ts",
          },
          null,
          2
        )
      );

      fs.writeFileSync(path.join(typesModuleDir, "index.d.ts"), typeDefinition);
    }
  });
}

module.exports = {
  COMMON_MODULES,
  createTypeDefinition,
  createModuleStubs,
  createLodashSubmodules,
  createLodashFunctionStub,
  createClassnamesSubmodules,
  createClassnamesFunctionStub,
};
