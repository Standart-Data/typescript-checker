import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Basic Consistency", () => {
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
        expect(tsResult.interfaces.UserInterface.isExported).toBe(
          reactResult.exports.UserInterface === true
        );
      },
    },

    // === ТИПЫ ===
    {
      name: "Type Alias",
      tsContent: "export type Status = 'pending' | 'approved' | 'rejected';",
      reactContent: "export type Status = 'pending' | 'approved' | 'rejected';",
      check: (tsResult, reactResult) => {
        expect(tsResult.types.Status).toBeDefined();
        expect(tsResult.types.Status.isExported).toBe(
          reactResult.exports.Status === true
        );
      },
    },

    // === ENUMS ===
    {
      name: "Enum Declaration",
      tsContent: `export enum Color {
        Red = "red",
        Green = "green",
        Blue = "blue"
      }`,
      reactContent: `export enum Color {
        Red = "red",
        Green = "green",
        Blue = "blue"
      }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.Color).toBeDefined();
        expect(tsResult.enums.Color.isExported).toBe(
          reactResult.exports.Color === true
        );
      },
    },
  ];

  testCases.forEach((tc) => {
    it(`should parse ${tc.name} consistently`, () => {
      const tsFile = createTempFileWithContent(tc.tsContent, ".ts");
      const reactFile = createTempFileWithContent(tc.reactContent, ".tsx");

      const tsResult = parseTypeScript([tsFile]);
      const reactResult = parseReact([reactFile]);

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
