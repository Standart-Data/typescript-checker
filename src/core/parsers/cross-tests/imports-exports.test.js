import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Imports & Exports Consistency", () => {
  const testCases = [
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
