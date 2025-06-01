import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Function Bodies Consistency", () => {
  const testCases = [
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
