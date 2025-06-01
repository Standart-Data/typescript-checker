import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Modules & Namespaces Consistency", () => {
  const testCases = [
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
        expect(tsResult.namespaces.Utils.isExported).toBe(true);
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

        // React парсер должен иметь аналогичную структуру для классов
        if (reactResult.classes?.Computer) {
          const reactClass = reactResult.classes.Computer;
          expect(reactClass.properties).toBeDefined();
          // React парсер имеет другую структуру для методов
          // Старый формат может отсутствовать в React парсере
          expect(reactClass.isExported).toBe(false);
        }
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
