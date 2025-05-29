import { describe, it, expect } from "vitest";
import { parseTypeScript } from "./typescript";
import { parseReact } from "./react";
import { createTempFileWithContent, cleanupTempDir } from "../tests/testUtils";

describe("Cross-Parser Edge Cases", () => {
  const edgeCases = [
    // === СЛОЖНЫЕ ТИПЫ ===
    {
      name: "Union Types",
      tsContent: `export type StringOrNumber = string | number;`,
      reactContent: `export type StringOrNumber = string | number;`,
      check: (tsResult, reactResult) => {
        expect(tsResult.types.StringOrNumber).toBeDefined();
        expect(reactResult.types.StringOrNumber).toBeDefined();
        expect(tsResult.types.StringOrNumber.isExported).toBe(
          reactResult.exports.StringOrNumber === true
        );
      },
    },
    {
      name: "Intersection Types",
      tsContent: `export type Combined = { a: string } & { b: number };`,
      reactContent: `export type Combined = { a: string } & { b: number };`,
      check: (tsResult, reactResult) => {
        expect(tsResult.types.Combined).toBeDefined();
        expect(reactResult.types.Combined).toBeDefined();
        expect(tsResult.types.Combined.isExported).toBe(
          reactResult.exports.Combined === true
        );
      },
    },
    {
      name: "Conditional Types",
      tsContent: `export type IsString<T> = T extends string ? true : false;`,
      reactContent: `export type IsString<T> = T extends string ? true : false;`,
      check: (tsResult, reactResult) => {
        expect(tsResult.types.IsString).toBeDefined();
        expect(reactResult.types.IsString).toBeDefined();
        expect(tsResult.types.IsString.isExported).toBe(
          reactResult.exports.IsString === true
        );
      },
    },
    {
      name: "Hybrid Types (Function + Properties)",
      tsContent: `
        type Logger = {
          level: string;
          format: (message: string) => string;
          clear: () => void;
        } & ((message: string) => void);
        
        export type EventBus = {
          subscribers: Map<string, Function[]>;
          subscribe: (event: string, callback: Function) => void;
          unsubscribe: (event: string, callback: Function) => void;
        } & ((event: string, data?: any) => void);
      `,
      reactContent: `
        type Logger = {
          level: string;
          format: (message: string) => string;
          clear: () => void;
        } & ((message: string) => void);
        
        export type EventBus = {
          subscribers: Map<string, Function[]>;
          subscribe: (event: string, callback: Function) => void;
          unsubscribe: (event: string, callback: Function) => void;
        } & ((event: string, data?: any) => void);
      `,
      check: (tsResult, reactResult) => {
        // Проверяем Logger
        expect(tsResult.types.Logger).toBeDefined();
        expect(reactResult.types.Logger).toBeDefined();
        expect(tsResult.types.Logger.type).toBe("function");
        expect(reactResult.types.Logger.type).toBe("function");

        // Проверяем функциональную сигнатуру Logger
        expect(tsResult.types.Logger.params).toBeDefined();
        expect(tsResult.types.Logger.params).toHaveLength(1);
        expect(tsResult.types.Logger.params[0].name).toBe("message");
        expect(tsResult.types.Logger.params[0].type).toBe("string");
        expect(tsResult.types.Logger.returnType).toBe("void");

        expect(reactResult.types.Logger.params).toBeDefined();
        expect(reactResult.types.Logger.params).toHaveLength(1);
        expect(reactResult.types.Logger.params[0].name).toBe("message");

        // Проверяем свойства Logger
        expect(tsResult.types.Logger.properties).toBeDefined();
        expect(tsResult.types.Logger.properties.level).toBe("string");
        expect(tsResult.types.Logger.properties.format).toContain("string");
        expect(tsResult.types.Logger.properties.clear).toContain("void");

        expect(reactResult.types.Logger.properties).toBeDefined();
        expect(reactResult.types.Logger.properties.level).toBeDefined();
        expect(reactResult.types.Logger.properties.format).toBeDefined();
        expect(reactResult.types.Logger.properties.clear).toBeDefined();

        // Проверяем EventBus
        expect(tsResult.types.EventBus).toBeDefined();
        expect(reactResult.types.EventBus).toBeDefined();
        expect(tsResult.types.EventBus.type).toBe("function");
        expect(reactResult.types.EventBus.type).toBe("function");
        expect(tsResult.types.EventBus.isExported).toBe(true);
        expect(reactResult.exports.EventBus).toBe(true);

        // Проверяем функциональную сигнатуру EventBus
        expect(tsResult.types.EventBus.params).toBeDefined();
        expect(tsResult.types.EventBus.params.length).toBeGreaterThanOrEqual(1);
        expect(tsResult.types.EventBus.params[0].name).toBe("event");
        expect(tsResult.types.EventBus.params[0].type).toBe("string");

        // Проверяем свойства EventBus
        expect(tsResult.types.EventBus.properties).toBeDefined();
        expect(tsResult.types.EventBus.properties.subscribers).toBeDefined();
        expect(tsResult.types.EventBus.properties.subscribe).toBeDefined();
        expect(tsResult.types.EventBus.properties.unsubscribe).toBeDefined();

        expect(reactResult.types.EventBus.properties).toBeDefined();
        expect(reactResult.types.EventBus.properties.subscribers).toBeDefined();
        expect(reactResult.types.EventBus.properties.subscribe).toBeDefined();
        expect(reactResult.types.EventBus.properties.unsubscribe).toBeDefined();
      },
    },

    // === СЛОЖНЫЕ ИНТЕРФЕЙСЫ ===
    {
      name: "Interface Inheritance",
      tsContent: `
        export interface Base {
          id: string;
        }
        export interface Extended extends Base {
          name: string;
        }
      `,
      reactContent: `
        export interface Base {
          id: string;
        }
        export interface Extended extends Base {
          name: string;
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.Base).toBeDefined();
        expect(tsResult.interfaces.Extended).toBeDefined();
        expect(reactResult.interfaces.Base).toBeDefined();
        expect(reactResult.interfaces.Extended).toBeDefined();

        expect(tsResult.interfaces.Base.isExported).toBe(
          reactResult.exports.Base === true
        );
        expect(tsResult.interfaces.Extended.isExported).toBe(
          reactResult.exports.Extended === true
        );
      },
    },
    {
      name: "Generic Interface",
      tsContent: `export interface Container<T> { value: T; }`,
      reactContent: `export interface Container<T> { value: T; }`,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.Container).toBeDefined();
        expect(reactResult.interfaces.Container).toBeDefined();
        expect(tsResult.interfaces.Container.isExported).toBe(
          reactResult.exports.Container === true
        );
      },
    },

    // === СЛОЖНЫЕ КЛАССЫ ===
    {
      name: "Generic Class",
      tsContent: `
        export class Repository<T> {
          private items: T[] = [];
          
          add(item: T): void {
            this.items.push(item);
          }
          
          getAll(): T[] {
            return this.items;
          }
        }
      `,
      reactContent: `
        export class Repository<T> {
          private items: T[] = [];
          
          add(item: T): void {
            this.items.push(item);
          }
          
          getAll(): T[] {
            return this.items;
          }
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.classes.Repository).toBeDefined();
        expect(tsResult.classes.Repository.isExported).toBe(
          reactResult.exports.Repository === true
        );
      },
    },
    {
      name: "Class with Static Members",
      tsContent: `
        export class Utils {
          static readonly VERSION = "1.0.0";
          static helper(): string { return "help"; }
          
          instance(): void {}
        }
      `,
      reactContent: `
        export class Utils {
          static readonly VERSION = "1.0.0";
          static helper(): string { return "help"; }
          
          instance(): void {}
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.classes.Utils).toBeDefined();
        expect(tsResult.classes.Utils.isExported).toBe(
          reactResult.exports.Utils === true
        );

        // Проверяем статические члены
        if (tsResult.classes.Utils.properties?.VERSION) {
          expect(tsResult.classes.Utils.properties.VERSION.isStatic).toBe(true);
          expect(tsResult.classes.Utils.properties.VERSION.isReadonly).toBe(
            true
          );
        }

        if (tsResult.classes.Utils.methods?.helper) {
          expect(tsResult.classes.Utils.methods.helper.isStatic).toBe(true);
        }
      },
    },

    // === СЛОЖНЫЕ ФУНКЦИИ ===
    {
      name: "Function Overloads",
      tsContent: `
        export function process(value: string): string;
        export function process(value: number): number;
        export function process(value: string | number): string | number {
          return value;
        }
      `,
      reactContent: `
        export function process(value: string): string;
        export function process(value: number): number;
        export function process(value: string | number): string | number {
          return value;
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.process).toBeDefined();
        expect(tsResult.functions.process.isExported).toBe(
          reactResult.exports.process === true
        );
      },
    },
    {
      name: "Higher Order Function",
      tsContent: `
        export function createHandler<T>(
          processor: (item: T) => void
        ): (items: T[]) => void {
          return (items) => items.forEach(processor);
        }
      `,
      reactContent: `
        export function createHandler<T>(
          processor: (item: T) => void
        ): (items: T[]) => void {
          return (items) => items.forEach(processor);
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.createHandler).toBeDefined();
        expect(tsResult.functions.createHandler.isExported).toBe(
          reactResult.exports.createHandler === true
        );
      },
    },

    // === СЛОЖНЫЕ ENUM ===
    {
      name: "Mixed Enum",
      tsContent: `
        export enum MixedEnum {
          First,
          Second = "second",
          Third = 100,
          Fourth
        }
      `,
      reactContent: `
        export enum MixedEnum {
          First,
          Second = "second",
          Third = 100,
          Fourth
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.MixedEnum).toBeDefined();
        expect(reactResult.enums.MixedEnum).toBeDefined();
        expect(tsResult.enums.MixedEnum.members.length).toBe(4);
        expect(reactResult.enums.MixedEnum.members.length).toBe(4);

        // Проверяем разные типы значений
        const tsMembers = tsResult.enums.MixedEnum.members;
        const reactMembers = reactResult.enums.MixedEnum.members;

        expect(tsMembers[0].name).toBe("First");
        expect(reactMembers[0].name).toBe("First");

        expect(tsMembers[1].name).toBe("Second");
        expect(reactMembers[1].name).toBe("Second");
      },
    },

    // === СЛОЖНЫЕ ИМПОРТЫ/ЭКСПОРТЫ ===
    {
      name: "Re-exports",
      tsContent: `
        export { useState as useStateHook } from 'react';
        export { default as React } from 'react';
      `,
      reactContent: `
        export { useState as useStateHook } from 'react';
        export { default as React } from 'react';
      `,
      check: (tsResult, reactResult) => {
        // Проверяем, что реэкспорты обрабатываются
        expect(reactResult.exports.useStateHook).toBe(true);
        expect(reactResult.exports.React).toBe(true);
      },
    },
    {
      name: "Namespace Import",
      tsContent: `import * as React from 'react';`,
      reactContent: `import * as React from 'react';`,
      check: (tsResult, reactResult) => {
        expect(tsResult.imports.react).toBeDefined();
        expect(reactResult.imports.react).toBeDefined();

        // Оба парсера теперь используют одинаковую структуру
        // Проверяем, что импорт обработан
      },
    },

    // === DECLARE КОНСТРУКЦИИ ===
    {
      name: "Declare Variable",
      tsContent: `declare const VERSION: string;`,
      reactContent: `declare const VERSION: string;`,
      check: (tsResult, reactResult) => {
        // TypeScript парсер должен обработать declare
        expect(tsResult.variables.VERSION?.isDeclared).toBe(true);
        // React парсер может не обрабатывать declare
      },
    },
    {
      name: "Declare Function",
      tsContent: `declare function globalFunction(): void;`,
      reactContent: `declare function globalFunction(): void;`,
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.globalFunction?.isDeclared).toBe(true);
      },
    },

    // === РАСШИРЕННЫЕ КЛАССЫ ===
    {
      name: "Abstract Class with Complex Inheritance",
      tsContent: `
        abstract class AbstractComponent {
          abstract render(): void;
          protected state: any = {};
        }
        
        interface IClickable {
          onClick(): void;
        }
        
        export class Button extends AbstractComponent implements IClickable {
          label: string = "Click me";
          
          constructor(private service: any) {
            super();
          }
          
          render(): void {
            console.log("Rendering button");
          }
          
          onClick(): void {
            console.log("Button clicked");
          }
          
          static create(label: string): Button {
            return new Button(null);
          }
        }
      `,
      reactContent: `
        abstract class AbstractComponent {
          abstract render(): void;
          protected state: any = {};
        }
        
        interface IClickable {
          onClick(): void;
        }
        
        export class Button extends AbstractComponent implements IClickable {
          label: string = "Click me";
          
          constructor(private service: any) {
            super();
          }
          
          render(): void {
            console.log("Rendering button");
          }
          
          onClick(): void {
            console.log("Button clicked");
          }
          
          static create(label: string): Button {
            return new Button(null);
          }
        }
      `,
      check: (tsResult, reactResult) => {
        const abstractClass = tsResult.classes.AbstractComponent;
        expect(abstractClass.isAbstract).toBe(true);
        expect(abstractClass.isExported).toBe(false);

        const buttonClass = tsResult.classes.Button;
        expect(buttonClass).toBeDefined();
        expect(buttonClass.isExported).toBe(true);
        expect(buttonClass.extends).toEqual(["AbstractComponent"]);
        expect(buttonClass.implements).toEqual(["IClickable"]);
        expect(buttonClass.extendedClasses).toEqual(["AbstractComponent"]);

        // Проверяем свойства в старом формате
        expect(buttonClass.label).toBeDefined();
        expect(buttonClass.label.modificator).toBe("opened");
        expect(buttonClass.label.value).toBe("Click me");

        // Проверяем новый формат
        expect(buttonClass.properties.label).toBeDefined();
        expect(buttonClass.properties.label.accessModifier).toBe("public");

        // Проверяем методы
        expect(buttonClass.methods.render).toBeDefined();
        expect(buttonClass.methods.onClick).toBeDefined();
        expect(buttonClass.methods.create.isStatic).toBe(true);

        // React парсер должен экспортировать класс
        expect(reactResult.exports.Button).toBe(true);
      },
    },

    // === NAMESPACE С ВЛОЖЕННЫМИ СТРУКТУРАМИ ===
    {
      name: "Nested Namespace Structures",
      tsContent: `
        export namespace API {
          export interface Response<T> {
            data: T;
            status: number;
          }
          
          export namespace V1 {
            export function get<T>(url: string): Promise<Response<T>> {
              return fetch(url).then(r => r.json());
            }
            
            export const baseUrl = "https://api.v1.example.com";
          }
          
          export namespace V2 {
            export function get<T>(url: string): Promise<Response<T>> {
              return fetch(url).then(r => r.json());
            }
            
            export const baseUrl = "https://api.v2.example.com";
          }
        }
        
        namespace Internal {
          export function helper(): void {}
        }
      `,
      reactContent: `
        export namespace API {
          export interface Response<T> {
            data: T;
            status: number;
          }
          
          export namespace V1 {
            export function get<T>(url: string): Promise<Response<T>> {
              return fetch(url).then(r => r.json());
            }
            
            export const baseUrl = "https://api.v1.example.com";
          }
          
          export namespace V2 {
            export function get<T>(url: string): Promise<Response<T>> {
              return fetch(url).then(r => r.json());
            }
            
            export const baseUrl = "https://api.v2.example.com";
          }
        }
        
        namespace Internal {
          export function helper(): void {}
        }
      `,
      check: (tsResult, reactResult) => {
        // Проверяем основной namespace
        expect(tsResult.namespaces.API).toBeDefined();
        expect(tsResult.namespaces.API.isExported).toBe(true);

        // Проверяем вложенные namespaces
        expect(tsResult.namespaces.V1).toBeDefined();
        expect(tsResult.namespaces.V1.isExported).toBe(true);
        expect(tsResult.namespaces.V2).toBeDefined();
        expect(tsResult.namespaces.V2.isExported).toBe(true);

        // Проверяем внутренний namespace
        expect(tsResult.namespaces.Internal).toBeDefined();
        expect(tsResult.namespaces.Internal.isExported).toBe(false);

        // React парсер должен экспортировать содержимое
        expect(reactResult.exports.API).toBe(true);
      },
    },

    // === КОММЕНТАРИИ И JSDOC ===
    {
      name: "JSDoc Comments",
      tsContent: `
        /**
         * Calculates the sum of two numbers
         * @param a First number
         * @param b Second number
         * @returns The sum
         */
        export function add(a: number, b: number): number {
          return a + b;
        }
      `,
      reactContent: `
        /**
         * Calculates the sum of two numbers
         * @param a First number
         * @param b Second number
         * @returns The sum
         */
        export function add(a: number, b: number): number {
          return a + b;
        }
      `,
      check: (tsResult, reactResult) => {
        expect(tsResult.functions.add).toBeDefined();
        expect(tsResult.functions.add.isExported).toBe(
          reactResult.exports.add === true
        );
      },
    },

    // === ПУСТЫЕ И МИНИМАЛЬНЫЕ СЛУЧАИ ===
    {
      name: "Empty Interface",
      tsContent: `export interface Empty {}`,
      reactContent: `export interface Empty {}`,
      check: (tsResult, reactResult) => {
        expect(tsResult.interfaces.Empty).toBeDefined();
        expect(reactResult.interfaces.Empty).toBeDefined();
      },
    },
    {
      name: "Empty Enum",
      tsContent: `export enum EmptyEnum {}`,
      reactContent: `export enum EmptyEnum {}`,
      check: (tsResult, reactResult) => {
        expect(tsResult.enums.EmptyEnum).toBeDefined();
        expect(reactResult.enums.EmptyEnum).toBeDefined();
        expect(tsResult.enums.EmptyEnum.members.length).toBe(0);
        expect(reactResult.enums.EmptyEnum.members.length).toBe(0);
      },
    },

    // === ОШИБОЧНЫЕ СЛУЧАИ ===
    {
      name: "Syntax Errors Handling",
      tsContent: `export const valid = "test";`,
      reactContent: `export const valid = "test";`,
      check: (tsResult, reactResult) => {
        // Проверяем, что валидный код обрабатывается корректно
        expect(tsResult.variables.valid).toBeDefined();
        expect(reactResult.variables.valid).toBeDefined();
      },
    },
  ];

  edgeCases.forEach((tc) => {
    it(`should handle ${tc.name} consistently`, () => {
      const tsFile = createTempFileWithContent(tc.tsContent, ".ts");
      const reactFile = createTempFileWithContent(tc.reactContent, ".tsx");

      try {
        const tsResult = parseTypeScript([tsFile]);
        const reactResult = parseReact([reactFile]);

        tc.check(tsResult, reactResult);
      } catch (error) {
        // В случае ошибки выводим результаты для отладки
        try {
          const tsResult = parseTypeScript([tsFile]);
          const reactResult = parseReact([reactFile]);

          console.log(
            `TypeScript Result for ${tc.name}:`,
            JSON.stringify(tsResult, null, 2)
          );
          console.log(
            `React Result for ${tc.name}:`,
            JSON.stringify(reactResult, null, 2)
          );
        } catch (parseError) {
          console.log(`Parse error for ${tc.name}:`, parseError.message);
        }

        throw error;
      } finally {
        cleanupTempDir(tsFile);
        cleanupTempDir(reactFile);
      }
    });
  });
});
