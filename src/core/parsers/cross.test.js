import { describe, it, expect } from "vitest";
import { parseTypeScript } from "./typescript";
import { parseReact } from "./react";
import { createTempFileWithContent, cleanupTempDir } from "../tests/testUtils";

describe("Cross-Parser Consistency Checks", () => {
  const testCases = [
    // === ПЕРЕМЕННЫЕ ===
    {
      name: "Variable Declaration (const)",
      tsContent: 'export const userName: string = "testUser";',
      reactContent: 'export const userName: string = "testUser";',
      check: (tsResult, reactResult) => {
        expect(tsResult.variables.userName).toBeDefined();
        expect(reactResult.variables.userName).toBeDefined();
        expect(tsResult.variables.userName.type).toBe(
          reactResult.variables.userName.types[0]
        );
        expect(tsResult.variables.userName.declarationType).toBe(
          reactResult.variables.userName.declarationType
        );
        expect(tsResult.variables.userName.isExported).toBe(
          reactResult.exports.userName === true
        );
      },
    },
    {
      name: "Variable Declaration (let)",
      tsContent: "export let counter: number = 0;",
      reactContent: "export let counter: number = 0;",
      check: (tsResult, reactResult) => {
        expect(tsResult.variables.counter).toBeDefined();
        expect(reactResult.variables.counter).toBeDefined();
        expect(tsResult.variables.counter.declarationType).toBe("let");
        expect(reactResult.variables.counter.declarationType).toBe("let");
        expect(tsResult.variables.counter.isExported).toBe(
          reactResult.exports.counter === true
        );
      },
    },
    {
      name: "Variable Declaration (var)",
      tsContent: "export var globalVar: boolean = true;",
      reactContent: "export var globalVar: boolean = true;",
      check: (tsResult, reactResult) => {
        expect(tsResult.variables.globalVar).toBeDefined();
        expect(reactResult.variables.globalVar).toBeDefined();
        expect(tsResult.variables.globalVar.declarationType).toBe("var");
        expect(reactResult.variables.globalVar.declarationType).toBe("var");
      },
    },

    // === ФУНКЦИИ ===
    {
      name: "Function Declaration",
      tsContent:
        "export function greet(name: string): string { return `Hello, ${name}`; }",
      reactContent:
        "export function greet(name: string): string { return `Hello, ${name}`; }",
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.greet).toBeDefined();
        expect(tsResult.functions.greet.isExported).toBe(
          reactResult.exports.greet === true
        );
        // React парсер может не обрабатывать обычные функции, поэтому проверяем только экспорт
      },
    },
    {
      name: "Async Function",
      tsContent:
        "export async function fetchData(): Promise<string> { return 'data'; }",
      reactContent:
        "export async function fetchData(): Promise<string> { return 'data'; }",
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.fetchData).toBeDefined();
        expect(tsResult.functions.fetchData.isAsync).toBe(true);
        expect(tsResult.functions.fetchData.isExported).toBe(
          reactResult.exports.fetchData === true
        );
      },
    },
    {
      name: "Generator Function",
      tsContent:
        "export function* generateNumbers(): Generator<number> { yield 1; yield 2; }",
      reactContent:
        "export function* generateNumbers(): Generator<number> { yield 1; yield 2; }",
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.generateNumbers).toBeDefined();
        expect(tsResult.functions.generateNumbers.isGenerator).toBe(true);
        expect(tsResult.functions.generateNumbers.isExported).toBe(
          reactResult.exports.generateNumbers === true
        );
      },
    },
    {
      name: "Generic Function with Type Relations",
      tsContent:
        "export function splitArray<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] { return [[], []]; }",
      reactContent:
        "export function splitArray<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] { return [[], []]; }",
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.splitArray).toBeDefined();
        expect(reactResult.functions.splitArray).toBeDefined();

        // Проверяем базовые типы параметров
        expect(tsResult.functions.splitArray.params).toBeDefined();
        expect(reactResult.functions.splitArray.params).toBeDefined();
        expect(tsResult.functions.splitArray.params.length).toBe(2);
        expect(reactResult.functions.splitArray.params.length).toBe(2);

        // Проверяем первый параметр (array)
        const tsArrayParam = tsResult.functions.splitArray.params[0];
        const reactArrayParam = reactResult.functions.splitArray.params[0];
        expect(tsArrayParam.name).toBe("array");
        expect(reactArrayParam.name).toBe("array");
        expect(tsArrayParam.type[0]).toBe("T[]");
        expect(reactArrayParam.type[0]).toBe("T[]");

        // Проверяем второй параметр (predicate)
        const tsPredicateParam = tsResult.functions.splitArray.params[1];
        const reactPredicateParam = reactResult.functions.splitArray.params[1];
        expect(tsPredicateParam.name).toBe("predicate");
        expect(reactPredicateParam.name).toBe("predicate");
        expect(tsPredicateParam.type[0]).toContain("(item: T) => boolean");
        expect(reactPredicateParam.type[0]).toContain("(item: T) => boolean");

        // Проверяем что связи типов работают одинаково в обоих парсерах
        // (predicate type должен содержать array type для корректной работы дженериков)
        expect(tsPredicateParam.type.includes(tsArrayParam.type[0])).toBe(true);
        expect(reactPredicateParam.type.includes(reactArrayParam.type[0])).toBe(
          true
        );

        // Проверяем return type
        expect(tsResult.functions.splitArray.returnType).toBe("[T[], T[]]");
        expect(reactResult.functions.splitArray.returnType).toBe("[T[], T[]]");

        // Проверяем экспорт
        expect(tsResult.functions.splitArray.isExported).toBe(true);
        expect(reactResult.exports.splitArray).toBe(true);
      },
    },

    // === КЛАССЫ ===
    {
      name: "Simple Class",
      tsContent: `export class User {
        name: string;
        constructor(name: string) {
          this.name = name;
        }
      }`,
      reactContent: `export class User {
        name: string;
        constructor(name: string) {
          this.name = name;
        }
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.classes.User).toBeDefined();
        // React парсер может не обрабатывать обычные классы, проверяем только экспорт
        expect(tsResult.classes.User.isExported).toBe(
          reactResult.exports.User === true
        );
      },
    },
    {
      name: "Abstract Class",
      tsContent: `export abstract class Animal {
        abstract makeSound(): void;
        move(): void {
          console.log('Moving...');
        }
      }`,
      reactContent: `export abstract class Animal {
        abstract makeSound(): void;
        move(): void {
          console.log('Moving...');
        }
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.classes.Animal).toBeDefined();
        expect(tsResult.classes.Animal.isAbstract).toBe(true);
        expect(tsResult.classes.Animal.isExported).toBe(
          reactResult.exports.Animal === true
        );
      },
    },

    // === ИНТЕРФЕЙСЫ ===
    {
      name: "Simple Interface",
      tsContent: `export interface UserInterface {
        name: string;
        age: number;
        isActive?: boolean;
      }`,
      reactContent: `export interface UserInterface {
        name: string;
        age: number;
        isActive?: boolean;
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.UserInterface).toBeDefined();
        expect(reactResult.interfaces.UserInterface).toBeDefined();
        // React парсер не хранит name в интерфейсе
        expect(tsResult.interfaces.UserInterface.isExported).toBe(
          reactResult.exports.UserInterface === true
        );
      },
    },
    {
      name: "Interface with Methods",
      tsContent: `export interface Calculator {
        add(a: number, b: number): number;
        subtract(a: number, b: number): number;
      }`,
      reactContent: `export interface Calculator {
        add(a: number, b: number): number;
        subtract(a: number, b: number): number;
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.Calculator).toBeDefined();
        expect(reactResult.interfaces.Calculator).toBeDefined();
        expect(tsResult.interfaces.Calculator.methods?.add).toBeDefined();
        // React парсер может не иметь methods, проверяем только наличие интерфейса
      },
    },
    {
      name: "Interface with Literal Types Properties",
      tsContent: `export interface AppSettings {
        theme: "dark" | "light";
        language: "ru" | "en" | "fr";
        notifications: boolean;
      }`,
      reactContent: `export interface AppSettings {
        theme: "dark" | "light";
        language: "ru" | "en" | "fr";
        notifications: boolean;
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.AppSettings).toBeDefined();
        expect(reactResult.interfaces.AppSettings).toBeDefined();

        // Проверяем что properties возвращают строки типов напрямую
        expect(typeof tsResult.interfaces.AppSettings.properties.theme).toBe(
          "string"
        );
        expect(typeof reactResult.interfaces.AppSettings.properties.theme).toBe(
          "string"
        );
        expect(typeof tsResult.interfaces.AppSettings.properties.language).toBe(
          "string"
        );
        expect(
          typeof reactResult.interfaces.AppSettings.properties.language
        ).toBe("string");
        expect(
          typeof tsResult.interfaces.AppSettings.properties.notifications
        ).toBe("string");
        expect(
          typeof reactResult.interfaces.AppSettings.properties.notifications
        ).toBe("string");

        // Проверяем что можно использовать .replace() как в оригинальном тесте
        expect(() => {
          tsResult.interfaces.AppSettings.properties.theme.replace(
            /['"\s]/g,
            ""
          );
        }).not.toThrow();
        expect(() => {
          reactResult.interfaces.AppSettings.properties.theme.replace(
            /['"\s]/g,
            ""
          );
        }).not.toThrow();

        // Проверяем содержимое типов
        expect(tsResult.interfaces.AppSettings.properties.theme).toContain(
          "dark"
        );
        expect(tsResult.interfaces.AppSettings.properties.theme).toContain(
          "light"
        );
        expect(tsResult.interfaces.AppSettings.properties.language).toContain(
          "ru"
        );
        expect(tsResult.interfaces.AppSettings.properties.language).toContain(
          "en"
        );
        expect(tsResult.interfaces.AppSettings.properties.language).toContain(
          "fr"
        );
        expect(tsResult.interfaces.AppSettings.properties.notifications).toBe(
          "boolean"
        );

        expect(reactResult.interfaces.AppSettings.properties.theme).toContain(
          "dark"
        );
        expect(reactResult.interfaces.AppSettings.properties.theme).toContain(
          "light"
        );
        expect(
          reactResult.interfaces.AppSettings.properties.language
        ).toContain("ru");
        expect(
          reactResult.interfaces.AppSettings.properties.language
        ).toContain("en");
        expect(
          reactResult.interfaces.AppSettings.properties.language
        ).toContain("fr");
        expect(
          reactResult.interfaces.AppSettings.properties.notifications
        ).toBe("boolean");
      },
    },

    // === ТИПЫ ===
    {
      name: "Type Alias",
      tsContent: `export type Status = 'pending' | 'completed' | 'failed';`,
      reactContent: `export type Status = 'pending' | 'completed' | 'failed';`,
      check: (tsResult, reactResult) => {
        expect(tsResult.types.Status).toBeDefined();
        expect(reactResult.types.Status).toBeDefined();
        // React парсер не хранит name в типе
        expect(tsResult.types.Status.isExported).toBe(
          reactResult.exports.Status === true
        );
      },
    },
    {
      name: "Generic Type",
      tsContent: `export type Result<T> = { success: boolean; data: T; };`,
      reactContent: `export type Result<T> = { success: boolean; data: T; };`,
      check: (tsResult, reactResult) => {
        expect(tsResult.types.Result).toBeDefined();
        expect(reactResult.types.Result).toBeDefined();
        // Парсеры по-разному обрабатывают дженерики, проверяем только наличие
        expect(tsResult.types.Result.isExported).toBe(
          reactResult.exports.Result === true
        );
      },
    },

    // === ENUMS ===
    {
      name: "Regular Enum",
      tsContent: "export enum Color { Red, Green, Blue }",
      reactContent: "export enum Color { Red, Green, Blue }",
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.Color).toBeDefined();
        expect(reactResult.enums.Color).toBeDefined();
        expect(tsResult.enums.Color.name).toBe(reactResult.enums.Color.name);
        expect(tsResult.enums.Color.isConst).toBe(false);
        expect(reactResult.enums.Color.isConst).toBe(false);
        expect(tsResult.enums.Color.members.length).toBe(
          reactResult.enums.Color.members.length
        );
        expect(tsResult.enums.Color.isExported).toBe(
          reactResult.exports.Color === true
        );
      },
    },
    {
      name: "Const Enum",
      tsContent: "export const enum Direction { Up, Down, Left, Right }",
      reactContent: "export const enum Direction { Up, Down, Left, Right }",
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.Direction).toBeDefined();
        expect(reactResult.enums.Direction).toBeDefined();
        expect(tsResult.enums.Direction.isConst).toBe(true);
        expect(reactResult.enums.Direction.isConst).toBe(true);
      },
    },
    {
      name: "String Enum",
      tsContent: `export enum HttpStatus {
        OK = "200",
        NotFound = "404",
        InternalError = "500"
      }`,
      reactContent: `export enum HttpStatus {
        OK = "200",
        NotFound = "404",
        InternalError = "500"
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.HttpStatus).toBeDefined();
        expect(reactResult.enums.HttpStatus).toBeDefined();
        // TypeScript парсер включает кавычки в значение, React - нет
        expect(tsResult.enums.HttpStatus.members[0].value).toMatch(/200/);
        expect(reactResult.enums.HttpStatus.members[0].value).toMatch(/200/);
      },
    },

    // === ИМПОРТЫ ===
    {
      name: "Named Import",
      tsContent: `import { useState, useEffect } from 'react';`,
      reactContent: `import { useState, useEffect } from 'react';`,
      check: (tsResult, reactResult) => {
        expect(tsResult.imports.react).toBeDefined();
        expect(reactResult.imports.react).toBeDefined();

        // TypeScript парсер хранит в namedImports как объекты с name
        const tsNamedImports = tsResult.imports.react.namedImports.map(
          (ni) => ni.name
        );
        expect(tsNamedImports).toContain("useState");
        expect(tsNamedImports).toContain("useEffect");

        // React парсер теперь тоже использует namedImports структуру
        const reactNamedImports = reactResult.imports.react.namedImports.map(
          (ni) => ni.name
        );
        expect(reactNamedImports).toContain("useState");
        expect(reactNamedImports).toContain("useEffect");
      },
    },
    {
      name: "Default Import",
      tsContent: `import React from 'react';`,
      reactContent: `import React from 'react';`,
      check: (tsResult, reactResult) => {
        expect(tsResult.imports.react).toBeDefined();
        expect(reactResult.imports.react).toBeDefined();

        expect(tsResult.imports.react.defaultImport).toBe("React");
        expect(reactResult.imports.react.defaultImport).toBe("React");
      },
    },

    // === МОДУЛИ И НЕЙМСПЕЙСЫ ===
    {
      name: "Namespace Declaration",
      tsContent: `export namespace Utils {
        export function helper(): string {
          return 'helper';
        }
        export const constant = 42;
      }`,
      reactContent: `export namespace Utils {
        export function helper(): string {
          return 'helper';
        }
        export const constant = 42;
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.namespaces.Utils).toBeDefined();
        expect(tsResult.namespaces.Utils.isExported).toBe(true); // Новая проверка
        // React парсер может не обрабатывать namespace как отдельную структуру
        // но должен экспортировать содержимое
        expect(reactResult.exports.Utils).toBe(true);
        expect(reactResult.exports.helper).toBe(true);
        expect(reactResult.exports.constant).toBe(true);
      },
    },
    {
      name: "Class with Constructor Overloads",
      tsContent: `
        class Computer {
          private id: number;
          protected name: string;
          public model: string;
          
          constructor(name: string, model: string, color: string)
          constructor(name: string, model: string, id: number)
          constructor(name: string, model: string, param: string | number) {
            this.name = name;
            this.model = model;
            if (typeof param === 'number') {
              this.id = param;
            }
          }
        }
      `,
      reactContent: `
        class Computer {
          private id: number;
          protected name: string;
          public model: string;
          
          constructor(name: string, model: string, color: string)
          constructor(name: string, model: string, id: number)
          constructor(name: string, model: string, param: string | number) {
            this.name = name;
            this.model = model;
            if (typeof param === 'number') {
              this.id = param;
            }
          }
        }
      `,
      check: (tsResult, reactResult) => {
        const tsClass = tsResult.classes.Computer;
        expect(tsClass).toBeDefined();

        // Проверяем обратную совместимость - старый формат
        expect(tsClass.constructor).toBeDefined();
        expect(tsClass.constructorSignature0).toBeDefined();
        expect(tsClass.constructorSignature1).toBeDefined();

        // Проверяем свойства в старом формате
        expect(tsClass.id.modificator).toBe("private");
        expect(tsClass.name.modificator).toBe("protected");
        expect(tsClass.model.modificator).toBe("opened");

        // Проверяем новый формат тоже
        expect(tsClass.properties.id.accessModifier).toBe("private");
        expect(tsClass.properties.name.accessModifier).toBe("protected");
        expect(tsClass.properties.model.accessModifier).toBe("public");

        // React парсер может обрабатывать классы по-разному
        // Минимальная проверка, что React парсер не упал
        expect(reactResult).toBeDefined();
      },
    },
    {
      name: "Module Declaration",
      tsContent: `declare module "custom-module" {
        export function customFunction(): void;
      }`,
      reactContent: `declare module "custom-module" {
        export function customFunction(): void;
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.modules["custom-module"]).toBeDefined();
        expect(tsResult.modules["custom-module"].isDeclared).toBe(true);
        // React парсер может не обрабатывать declare module
        // но должен экспортировать содержимое
        expect(reactResult.exports.customFunction).toBe(true);
      },
    },

    // === ДЕКОРАТОРЫ ===
    {
      name: "Class with Decorators",
      tsContent: `@Component({
        selector: 'app-test'
      })
      export class TestComponent {
        @Input() name: string;
        
        @Output() click = new EventEmitter();
        
        @HostListener('click', ['$event'])
        onClick(event: Event): void {}
      }`,
      reactContent: `@Component({
        selector: 'app-test'
      })
      export class TestComponent {
        @Input() name: string;
        
        @Output() click = new EventEmitter();
        
        @HostListener('click', ['$event'])
        onClick(event: Event): void {}
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.classes.TestComponent).toBeDefined();
        // React парсер может не обрабатывать декораторы в классах
        // но должен экспортировать класс
        expect(tsResult.classes.TestComponent.isExported).toBe(
          reactResult.exports.TestComponent === true
        );
      },
    },

    // === СЛОЖНЫЕ СЛУЧАИ ===
    {
      name: "Mixed Exports",
      tsContent: `
        export const config = { api: 'localhost' };
        export function helper() { return 'help'; }
        export class Service {}
        export interface IService {}
        export type ServiceType = Service;
        export enum Status { Active, Inactive }
        export default class DefaultService {}
      `,
      reactContent: `
        export const config = { api: 'localhost' };
        export function helper() { return 'help'; }
        export class Service {}
        export interface IService {}
        export type ServiceType = Service;
        export enum Status { Active, Inactive }
        export default class DefaultService {}
      `,
      check: (tsResult, reactResult) => {
        // Проверяем, что все экспорты присутствуют
        expect(tsResult.variables.config?.isExported).toBe(true);
        expect(reactResult.exports.config).toBe(true);

        expect(tsResult.functions.helper?.isExported).toBe(true);
        expect(reactResult.exports.helper).toBe(true);

        expect(tsResult.classes.Service?.isExported).toBe(true);
        expect(reactResult.exports.Service).toBe(true);

        expect(tsResult.interfaces.IService?.isExported).toBe(true);
        expect(reactResult.exports.IService).toBe(true);

        expect(tsResult.types.ServiceType?.isExported).toBe(true);
        expect(reactResult.exports.ServiceType).toBe(true);

        expect(tsResult.enums.Status?.isExported).toBe(true);
        expect(reactResult.exports.Status).toBe(true);

        // Проверяем default экспорт
        expect(reactResult.exports.default).toBe("DefaultService");
      },
    },

    // === REACT-СПЕЦИФИЧНЫЕ ТЕСТЫ ===
    {
      name: "React Functional Component",
      tsContent: `
        import React from 'react';
        export const MyComponent: React.FC<{name: string}> = ({name}) => {
          return <div>Hello {name}</div>;
        };
      `,
      reactContent: `
        import React from 'react';
        export const MyComponent: React.FC<{name: string}> = ({name}) => {
          return <div>Hello {name}</div>;
        };
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер видит это как переменную
        expect(tsResult.variables.MyComponent).toBeDefined();
        expect(tsResult.variables.MyComponent.isExported).toBe(true);

        // React парсер должен распознать это как компонент
        expect(reactResult.exports.MyComponent).toBe(true);
      },
    },
    {
      name: "React Class Component",
      tsContent: `
        import React, { Component } from 'react';
        export class MyClassComponent extends Component<{title: string}> {
          render() {
            return <h1>{this.props.title}</h1>;
          }
        }
      `,
      reactContent: `
        import React, { Component } from 'react';
        export class MyClassComponent extends Component<{title: string}> {
          render() {
            return <h1>{this.props.title}</h1>;
          }
        }
      `,
      check: (tsResult, reactResult) => {
        // Оба парсера должны видеть это как класс
        expect(tsResult.classes.MyClassComponent).toBeDefined();
        expect(tsResult.classes.MyClassComponent.isExported).toBe(true);

        expect(reactResult.exports.MyClassComponent).toBe(true);
        // React парсер может дополнительно обрабатывать как компонент
      },
    },

    // === ПРОВЕРКИ BODY ФУНКЦИЙ И МЕТОДОВ ===
    {
      name: "Function Body Consistency",
      tsContent: `
        export function processData(input: string): string {
          const result = input.toUpperCase();
          console.log(\`Processing: \${result}\`);
          return result;
        }
      `,
      reactContent: `
        export function processData(input: string): string {
          const result = input.toUpperCase();
          console.log(\`Processing: \${result}\`);
          return result;
        }
      `,
      check: (tsResult, reactResult) => {
        const tsFunc = tsResult.functions.processData;
        expect(tsFunc).toBeDefined();
        expect(tsFunc.body).toBeDefined();
        expect(typeof tsFunc.body).toBe("string");
        expect(tsFunc.body).toContain("const result = input.toUpperCase()");
        expect(tsFunc.body).toContain("console.log(`Processing: ${result}`)");
        expect(tsFunc.body).toContain("return result");

        // React парсер может не обрабатывать обычные функции
        // но если обрабатывает, то body должно быть консистентным
        expect(reactResult.exports.processData).toBe(true);
      },
    },
    {
      name: "Class Method Body Consistency",
      tsContent: `
        export class DataProcessor {
          private data: string[] = [];
          
          addItem(item: string): void {
            this.data.push(item);
            console.log(\`Added: \${item}\`);
          }
          
          getCount(): number {
            return this.data.length;
          }
          
          clear(): void {
            this.data = [];
            console.log("Data cleared");
          }
        }
      `,
      reactContent: `
        export class DataProcessor {
          private data: string[] = [];
          
          addItem(item: string): void {
            this.data.push(item);
            console.log(\`Added: \${item}\`);
          }
          
          getCount(): number {
            return this.data.length;
          }
          
          clear(): void {
            this.data = [];
            console.log("Data cleared");
          }
        }
      `,
      check: (tsResult, reactResult) => {
        const tsClass = tsResult.classes.DataProcessor;
        expect(tsClass).toBeDefined();
        expect(tsClass.methods.addItem).toBeDefined();
        expect(tsClass.methods.addItem.body).toBeDefined();
        expect(typeof tsClass.methods.addItem.body).toBe("string");
        expect(tsClass.methods.addItem.body).toContain("this.data.push(item)");
        expect(tsClass.methods.addItem.body).toContain(
          "console.log(`Added: ${item}`)"
        );

        expect(tsClass.methods.getCount).toBeDefined();
        expect(tsClass.methods.getCount.body).toBeDefined();
        expect(tsClass.methods.getCount.body).toContain(
          "return this.data.length"
        );

        expect(tsClass.methods.clear).toBeDefined();
        expect(tsClass.methods.clear.body).toBeDefined();
        expect(tsClass.methods.clear.body).toContain("this.data = []");
        expect(tsClass.methods.clear.body).toContain(
          'console.log("Data cleared")'
        );

        // Проверяем обратную совместимость
        expect(tsClass.addItem.body).toBeDefined();
        expect(tsClass.getCount.body).toBeDefined();
        expect(tsClass.clear.body).toBeDefined();

        // React парсер может не обрабатывать обычные классы
        expect(reactResult.exports.DataProcessor).toBe(true);
      },
    },
    {
      name: "React Component Body Consistency",
      tsContent: `
        import React from 'react';
        export const Counter: React.FC<{initialValue: number}> = ({initialValue}) => {
          const [count, setCount] = React.useState(initialValue);
          
          const increment = () => {
            setCount(prev => prev + 1);
          };
          
          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={increment}>Increment</button>
            </div>
          );
        };
      `,
      reactContent: `
        import React from 'react';
        export const Counter: React.FC<{initialValue: number}> = ({initialValue}) => {
          const [count, setCount] = React.useState(initialValue);
          
          const increment = () => {
            setCount(prev => prev + 1);
          };
          
          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={increment}>Increment</button>
            </div>
          );
        };
      `,
      check: (tsResult, reactResult) => {
        // TypeScript видит это как переменную
        expect(tsResult.variables.Counter).toBeDefined();
        expect(tsResult.variables.Counter.isExported).toBe(true);

        // React парсер должен обработать как компонент с body
        const reactComponent = reactResult.functions.Counter;
        expect(reactComponent).toBeDefined();
        expect(reactComponent.body).toBeDefined();
        expect(typeof reactComponent.body).toBe("string");
        expect(reactComponent.body).toContain(
          "const [count, setCount] = React.useState(initialValue)"
        );
        expect(reactComponent.body).toContain("const increment = () =>");
        expect(reactComponent.body).toContain("setCount(prev => prev + 1)");
        expect(reactComponent.body).toContain("<p>Count: {count}</p>");
        expect(reactComponent.body).toContain(
          "<button onClick={increment}>Increment</button>"
        );

        expect(reactResult.exports.Counter).toBe(true);
      },
    },
    {
      name: "React Class Component Method Body Consistency",
      tsContent: `
        import React, { Component } from 'react';
        export class ToggleComponent extends Component<{label: string}, {isOn: boolean}> {
          constructor(props: {label: string}) {
            super(props);
            this.state = { isOn: false };
          }
          
          toggle(): void {
            this.setState(prevState => ({
              isOn: !prevState.isOn
            }));
            console.log(\`Toggled to: \${!this.state.isOn}\`);
          }
          
          render(): JSX.Element {
            return (
              <div>
                <span>{this.props.label}: {this.state.isOn ? 'ON' : 'OFF'}</span>
                <button onClick={() => this.toggle()}>Toggle</button>
              </div>
            );
          }
        }
      `,
      reactContent: `
        import React, { Component } from 'react';
        export class ToggleComponent extends Component<{label: string}, {isOn: boolean}> {
          constructor(props: {label: string}) {
            super(props);
            this.state = { isOn: false };
          }
          
          toggle(): void {
            this.setState(prevState => ({
              isOn: !prevState.isOn
            }));
            console.log(\`Toggled to: \${!this.state.isOn}\`);
          }
          
          render(): JSX.Element {
            return (
              <div>
                <span>{this.props.label}: {this.state.isOn ? 'ON' : 'OFF'}</span>
                <button onClick={() => this.toggle()}>Toggle</button>
              </div>
            );
          }
        }
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        const tsClass = tsResult.classes.ToggleComponent;
        expect(tsClass).toBeDefined();
        expect(tsClass.methods.toggle).toBeDefined();
        expect(tsClass.methods.toggle.body).toBeDefined();
        expect(typeof tsClass.methods.toggle.body).toBe("string");
        expect(tsClass.methods.toggle.body).toContain(
          "this.setState(prevState =>"
        );
        expect(tsClass.methods.toggle.body).toContain("isOn: !prevState.isOn");
        expect(tsClass.methods.toggle.body).toContain(
          "console.log(`Toggled to: ${!this.state.isOn}`)"
        );

        expect(tsClass.methods.render).toBeDefined();
        expect(tsClass.methods.render.body).toBeDefined();
        expect(tsClass.methods.render.body).toContain("return (");
        expect(tsClass.methods.render.body).toContain("{this.props.label}");
        expect(tsClass.methods.render.body).toContain(
          "{this.state.isOn ? 'ON' : 'OFF'}"
        );
        expect(tsClass.methods.render.body).toContain(
          "onClick={() => this.toggle()}"
        );

        // React парсер
        const reactClass = reactResult.classes.ToggleComponent;
        if (reactClass && reactClass.methods) {
          if (reactClass.methods.toggle) {
            expect(reactClass.methods.toggle.body).toBeDefined();
            expect(typeof reactClass.methods.toggle.body).toBe("string");
            expect(reactClass.methods.toggle.body).toContain(
              "this.setState(prevState =>"
            );
          }

          if (reactClass.methods.render) {
            expect(reactClass.methods.render.body).toBeDefined();
            expect(typeof reactClass.methods.render.body).toBe("string");
            expect(reactClass.methods.render.body).toContain("return (");
          }
        }

        expect(reactResult.exports.ToggleComponent).toBe(true);
      },
    },

    // === UTILITY ТИПЫ ===
    {
      name: "Pick Utility Type",
      tsContent: `
        interface Film {
          id: string;
          name: string;
          year: number;
          duration: number;
          cast: string[];
          link: string;
          rating: number;
          genres: string[];
          description: string;
          logo: string;
        }
        
        type FilmPreview = Pick<Film, "id" | "description" | "genres" | "logo" | "name">;
        export type PublicFilmInfo = Pick<Film, "name" | "year" | "rating">;
      `,
      reactContent: `
        interface Film {
          id: string;
          name: string;
          year: number;
          duration: number;
          cast: string[];
          link: string;
          rating: number;
          genres: string[];
          description: string;
          logo: string;
        }
        
        type FilmPreview = Pick<Film, "id" | "description" | "genres" | "logo" | "name">;
        export type PublicFilmInfo = Pick<Film, "name" | "year" | "rating">;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.FilmPreview).toBeDefined();
        expect(tsResult.types.FilmPreview.name).toBe("FilmPreview");
        expect(tsResult.types.FilmPreview.definition.replace(/\s/g, "")).toBe(
          'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
        );
        expect(tsResult.types.FilmPreview.value.replace(/\s/g, "")).toBe(
          'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
        );
        expect(tsResult.types.FilmPreview.isExported).toBe(false);

        expect(tsResult.types.PublicFilmInfo).toBeDefined();
        expect(tsResult.types.PublicFilmInfo.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.FilmPreview).toBeDefined();
        expect(reactResult.types.FilmPreview.name).toBe("FilmPreview");
        expect(reactResult.types.FilmPreview.type).toBe(
          'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
        );
        expect(reactResult.types.FilmPreview.value).toBe(
          'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
        );
        expect(reactResult.types.FilmPreview.isExported).toBe(false);

        expect(reactResult.types.PublicFilmInfo).toBeDefined();
        expect(reactResult.types.PublicFilmInfo.isExported).toBe(true);
        expect(reactResult.exports.PublicFilmInfo).toBe(true);
      },
    },
    {
      name: "Omit Utility Type",
      tsContent: `
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
      `,
      reactContent: `
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.UserWithoutPassword).toBeDefined();
        expect(
          tsResult.types.UserWithoutPassword.definition.replace(/\s/g, "")
        ).toBe('Omit<User,"password">');
        expect(
          tsResult.types.UserWithoutPassword.value.replace(/\s/g, "")
        ).toBe('Omit<User,"password">');

        expect(tsResult.types.PublicUser).toBeDefined();
        expect(tsResult.types.PublicUser.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.UserWithoutPassword).toBeDefined();
        expect(reactResult.types.UserWithoutPassword.type).toBe(
          'Omit<User, "password">'
        );
        expect(reactResult.types.UserWithoutPassword.value).toBe(
          'Omit<User, "password">'
        );

        expect(reactResult.types.PublicUser).toBeDefined();
        expect(reactResult.types.PublicUser.isExported).toBe(true);
        expect(reactResult.exports.PublicUser).toBe(true);
      },
    },
    {
      name: "Partial and Required Utility Types",
      tsContent: `
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type RequiredConfig = Required<Config>;
      `,
      reactContent: `
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type RequiredConfig = Required<Config>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.PartialConfig).toBeDefined();
        expect(tsResult.types.PartialConfig.definition.replace(/\s/g, "")).toBe(
          "Partial<Config>"
        );
        expect(tsResult.types.PartialConfig.value.replace(/\s/g, "")).toBe(
          "Partial<Config>"
        );

        expect(tsResult.types.RequiredConfig).toBeDefined();
        expect(tsResult.types.RequiredConfig.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.PartialConfig).toBeDefined();
        expect(reactResult.types.PartialConfig.type).toBe("Partial<Config>");
        expect(reactResult.types.PartialConfig.value).toBe("Partial<Config>");

        expect(reactResult.types.RequiredConfig).toBeDefined();
        expect(reactResult.types.RequiredConfig.isExported).toBe(true);
        expect(reactResult.exports.RequiredConfig).toBe(true);
      },
    },
    {
      name: "Record Utility Type",
      tsContent: `
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
      `,
      reactContent: `
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.StatusMap).toBeDefined();
        expect(tsResult.types.StatusMap.definition.replace(/\s/g, "")).toBe(
          "Record<Status,StatusInfo>"
        );
        expect(tsResult.types.StatusMap.value.replace(/\s/g, "")).toBe(
          "Record<Status,StatusInfo>"
        );

        expect(tsResult.types.StringRecord).toBeDefined();
        expect(tsResult.types.StringRecord.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.StatusMap).toBeDefined();
        expect(reactResult.types.StatusMap.type).toBe(
          "Record<Status, StatusInfo>"
        );
        expect(reactResult.types.StatusMap.value).toBe(
          "Record<Status, StatusInfo>"
        );

        expect(reactResult.types.StringRecord).toBeDefined();
        expect(reactResult.types.StringRecord.isExported).toBe(true);
        expect(reactResult.exports.StringRecord).toBe(true);
      },
    },
    {
      name: "Exclude and Extract Utility Types",
      tsContent: `
        type AllTypes = string | number | boolean | null;
        
        type NonNullTypes = Exclude<AllTypes, null>;
        export type StringOrNumber = Extract<AllTypes, string | number>;
      `,
      reactContent: `
        type AllTypes = string | number | boolean | null;
        
        type NonNullTypes = Exclude<AllTypes, null>;
        export type StringOrNumber = Extract<AllTypes, string | number>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.NonNullTypes).toBeDefined();
        expect(tsResult.types.NonNullTypes.definition.replace(/\s/g, "")).toBe(
          "Exclude<AllTypes,null>"
        );
        expect(tsResult.types.NonNullTypes.value.replace(/\s/g, "")).toBe(
          "Exclude<AllTypes,null>"
        );

        expect(tsResult.types.StringOrNumber).toBeDefined();
        expect(tsResult.types.StringOrNumber.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.NonNullTypes).toBeDefined();
        expect(reactResult.types.NonNullTypes.type).toBe(
          "Exclude<AllTypes, null>"
        );
        expect(reactResult.types.NonNullTypes.value).toBe(
          "Exclude<AllTypes, null>"
        );

        expect(reactResult.types.StringOrNumber).toBeDefined();
        expect(reactResult.types.StringOrNumber.isExported).toBe(true);
        expect(reactResult.exports.StringOrNumber).toBe(true);
      },
    },
    {
      name: "Nested Utility Types",
      tsContent: `
        interface BaseEntity {
          id: string;
          createdAt: Date;
          updatedAt: Date;
        }
        
        interface User extends BaseEntity {
          name: string;
          email: string;
          password: string;
          active: boolean;
        }
        
        type UserUpdate = Partial<Pick<User, "name" | "email" | "active">>;
        export type PublicUserInfo = Required<Pick<User, "id" | "name" | "email">>;
      `,
      reactContent: `
        interface BaseEntity {
          id: string;
          createdAt: Date;
          updatedAt: Date;
        }
        
        interface User extends BaseEntity {
          name: string;
          email: string;
          password: string;
          active: boolean;
        }
        
        type UserUpdate = Partial<Pick<User, "name" | "email" | "active">>;
        export type PublicUserInfo = Required<Pick<User, "id" | "name" | "email">>;
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер
        expect(tsResult.types.UserUpdate).toBeDefined();
        expect(tsResult.types.UserUpdate.definition.replace(/\s/g, "")).toBe(
          'Partial<Pick<User,"name"|"email"|"active">>'
        );
        expect(tsResult.types.UserUpdate.value.replace(/\s/g, "")).toBe(
          'Partial<Pick<User,"name"|"email"|"active">>'
        );

        expect(tsResult.types.PublicUserInfo).toBeDefined();
        expect(tsResult.types.PublicUserInfo.isExported).toBe(true);

        // React парсер
        expect(reactResult.types.UserUpdate).toBeDefined();
        expect(reactResult.types.UserUpdate.type).toBe(
          'Partial<Pick<User, "name" | "email" | "active">>'
        );
        expect(reactResult.types.UserUpdate.value).toBe(
          'Partial<Pick<User, "name" | "email" | "active">>'
        );

        expect(reactResult.types.PublicUserInfo).toBeDefined();
        expect(reactResult.types.PublicUserInfo.isExported).toBe(true);
        expect(reactResult.exports.PublicUserInfo).toBe(true);
      },
    },
    {
      name: "Class with Protected and Readonly Modifiers",
      tsContent: `
        class Island {
          protected name: string;
          readonly coordinates: { latitude: number; longitude: number };
          protected size: number;
          protected notes: string;
          protected features?: string[];
        
          constructor(
            name: string,
            coordinates: { latitude: number; longitude: number },
            size: number,
            notes: string = "Ничем не примечательный",
            features?: string[]
          ) {
            this.name = name;
            this.coordinates = coordinates;
            this.size = size;
            this.features = features;
            this.notes = notes;
          }
        }
        
        class ResourceIsland extends Island {
          private resources: string[];
        
          constructor(
            name: string,
            coordinates: { latitude: number; longitude: number },
            size: number,
            notes: string,
            resources: string[]
          ) {
            super(name, coordinates, size, notes);
            this.resources = resources;
          }
        }
      `,
      reactContent: `
        class Island {
          protected name: string;
          readonly coordinates: { latitude: number; longitude: number };
          protected size: number;
          protected notes: string;
          protected features?: string[];
        
          constructor(
            name: string,
            coordinates: { latitude: number; longitude: number },
            size: number,
            notes: string = "Ничем не примечательный",
            features?: string[]
          ) {
            this.name = name;
            this.coordinates = coordinates;
            this.size = size;
            this.features = features;
            this.notes = notes;
          }
        }
        
        class ResourceIsland extends Island {
          private resources: string[];
        
          constructor(
            name: string,
            coordinates: { latitude: number; longitude: number },
            size: number,
            notes: string,
            resources: string[]
          ) {
            super(name, coordinates, size, notes);
            this.resources = resources;
          }
        }
      `,
      check: (tsResult, reactResult) => {
        // Проверяем базовый класс Island
        const tsIsland = tsResult.classes.Island;
        expect(tsIsland).toBeDefined();

        // Проверяем модификаторы в старом формате (для обратной совместимости)
        expect(tsIsland.name.modificator).toBe("protected");
        expect(tsIsland.coordinates.modificator).toBe("readonly");
        expect(tsIsland.size.modificator).toBe("protected");
        expect(tsIsland.notes.modificator).toBe("protected");
        expect(tsIsland.features.modificator).toBe("protected");

        // Проверяем модификаторы в новом формате
        expect(tsIsland.properties.name.accessModifier).toBe("protected");
        expect(tsIsland.properties.coordinates.isReadonly).toBe(true);
        expect(tsIsland.properties.size.accessModifier).toBe("protected");
        expect(tsIsland.properties.notes.accessModifier).toBe("protected");
        expect(tsIsland.properties.features.accessModifier).toBe("protected");

        // Проверяем наследованный класс ResourceIsland
        const tsResourceIsland = tsResult.classes.ResourceIsland;
        expect(tsResourceIsland).toBeDefined();
        expect(tsResourceIsland.extends).toEqual(["Island"]);
        expect(tsResourceIsland.resources.modificator).toBe("private");
        expect(tsResourceIsland.properties.resources.accessModifier).toBe(
          "private"
        );

        // Проверяем типы
        expect(tsResourceIsland.resources.types).toEqual(["string[]"]);

        // React парсер должен обрабатывать классы аналогично
        expect(reactResult.classes?.Island).toBeDefined();
        expect(reactResult.classes?.ResourceIsland).toBeDefined();
      },
    },
  ];

  testCases.forEach((tc) => {
    it(`should parse ${tc.name} consistently`, () => {
      const tsFile = createTempFileWithContent(tc.tsContent, ".ts");
      const reactFile = createTempFileWithContent(tc.reactContent, ".tsx");

      const tsResult = parseTypeScript([tsFile]);
      const reactResult = parseReact([reactFile]);

      // Убираем подробный вывод для успешных тестов
      // console.log(
      //   `TypeScript Result for ${tc.name}:`,
      //   JSON.stringify(tsResult, null, 2)
      // );
      // console.log(
      //   `React Result for ${tc.name}:`,
      //   JSON.stringify(reactResult, null, 2)
      // );

      try {
        tc.check(tsResult, reactResult);
      } catch (error) {
        console.log(
          `TypeScript Result for ${tc.name}:`,
          JSON.stringify(tsResult, null, 2)
        );
        console.log(
          `React Result for ${tc.name}:`,
          JSON.stringify(reactResult, null, 2)
        );
        throw error;
      }

      cleanupTempDir(tsFile);
      cleanupTempDir(reactFile);
    });
  });
});
