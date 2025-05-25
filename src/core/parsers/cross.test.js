import { describe, it, expect } from "vitest";
import { parseTypeScript } from "./typescript";
import { parseReact } from "./react/parseReact";
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
        expect(reactResult.imports.length).toBeGreaterThan(0);
        const reactImport = reactResult.imports.find(
          (imp) => imp.path === "react"
        );
        expect(reactImport).toBeDefined();

        // TypeScript парсер хранит в namedImports как объекты с name
        const tsNamedImports = tsResult.imports.react.namedImports.map(
          (ni) => ni.name
        );
        expect(tsNamedImports).toContain("useState");
        expect(tsNamedImports).toContain("useEffect");

        // React парсер хранит в specifiers
        const reactNamedImports = reactImport.specifiers.map(
          (spec) => spec.local
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
        expect(reactResult.imports.length).toBeGreaterThan(0);
        const reactImport = reactResult.imports.find(
          (imp) => imp.path === "react"
        );
        expect(reactImport).toBeDefined();

        expect(tsResult.imports.react.defaultImport).toBe("React");

        // React парсер хранит default импорт как specifier с imported: 'default'
        const defaultSpec = reactImport.specifiers.find(
          (spec) => spec.imported === "default"
        );
        expect(defaultSpec?.local).toBe("React");
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
        // React парсер может не обрабатывать namespace как отдельную структуру
        // но должен экспортировать содержимое
        expect(reactResult.exports.Utils).toBe(true);
        expect(reactResult.exports.helper).toBe(true);
        expect(reactResult.exports.constant).toBe(true);
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
