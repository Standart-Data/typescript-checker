import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Type Assertions Consistency", () => {
  const testCases = [
    // === AS OPERATOR ===
    {
      name: "Type Assertion with 'as' operator",
      tsContent: `
        const userInput = "123" as string;
        const userId = "456" as number;
        const config = { timeout: 5000 } as const;
      `,
      reactContent: `
        const userInput = "123" as string;
        const userId = "456" as number;
        const config = { timeout: 5000 } as const;
      `,
      check: (tsResult, reactResult) => {
        // Проверяем userInput
        expect(tsResult.variables.userInput).toBeDefined();
        expect(reactResult.variables.userInput).toBeDefined();
        expect(tsResult.variables.userInput.typeAssertion).toBeDefined();
        expect(reactResult.variables.userInput.typeAssertion).toBeDefined();
        expect(tsResult.variables.userInput.typeAssertion.operator).toBe("as");
        expect(reactResult.variables.userInput.typeAssertion.operator).toBe(
          "as"
        );
        expect(tsResult.variables.userInput.typeAssertion.type).toBe("string");
        expect(reactResult.variables.userInput.typeAssertion.type).toBe(
          "string"
        );

        // Проверяем config с as const
        expect(tsResult.variables.config.typeAssertion).toBeDefined();
        expect(reactResult.variables.config.typeAssertion).toBeDefined();
        expect(tsResult.variables.config.typeAssertion.operator).toBe("as");
        expect(reactResult.variables.config.typeAssertion.operator).toBe("as");
        expect(tsResult.variables.config.typeAssertion.type).toBe("const");
        expect(reactResult.variables.config.typeAssertion.type).toBe("const");
      },
    },

    // === COMPLEX ASSERTIONS ===
    {
      name: "Complex type assertions",
      tsContent: `
        interface User {
          id: number;
          name: string;
        }

        const data: unknown = { id: 1, name: "test" };
        const user = data as User;
        const constArray = [1, 2, 3] as const;
        const readonlyArray = [4, 5, 6] as readonly number[];
      `,
      reactContent: `
        interface User {
          id: number;
          name: string;
        }

        const data: unknown = { id: 1, name: "test" };
        const user = data as User;
        const constArray = [1, 2, 3] as const;
        const readonlyArray = [4, 5, 6] as readonly number[];
      `,
      check: (tsResult, reactResult) => {
        // Проверяем user
        expect(tsResult.variables.user?.typeAssertion).toBeDefined();
        expect(reactResult.variables.user?.typeAssertion).toBeDefined();
        expect(tsResult.variables.user.typeAssertion.operator).toBe("as");
        expect(reactResult.variables.user.typeAssertion.operator).toBe("as");
        expect(tsResult.variables.user.typeAssertion.type).toBe("User");
        expect(reactResult.variables.user.typeAssertion.type).toBe("User");

        // Проверяем constArray
        expect(tsResult.variables.constArray?.typeAssertion).toBeDefined();
        expect(reactResult.variables.constArray?.typeAssertion).toBeDefined();
        expect(tsResult.variables.constArray.typeAssertion.type).toBe("const");
        expect(reactResult.variables.constArray.typeAssertion.type).toBe(
          "const"
        );

        // Проверяем readonlyArray
        expect(tsResult.variables.readonlyArray?.typeAssertion).toBeDefined();
        expect(
          reactResult.variables.readonlyArray?.typeAssertion
        ).toBeDefined();
        expect(tsResult.variables.readonlyArray.typeAssertion.type).toContain(
          "readonly"
        );
        expect(
          reactResult.variables.readonlyArray.typeAssertion.type
        ).toContain("readonly");
      },
    },

    // === AS CONST VARIATIONS ===
    {
      name: "As const variations",
      tsContent: `
        const colors = {
          red: "#ff0000",
          green: "#00ff00",
          blue: "#0000ff"
        } as const;

        const statusList = ["pending", "approved", "rejected"] as const;
        const numbers = [1, 2, 3, 4, 5] as const;
      `,
      reactContent: `
        const colors = {
          red: "#ff0000",
          green: "#00ff00",
          blue: "#0000ff"
        } as const;

        const statusList = ["pending", "approved", "rejected"] as const;
        const numbers = [1, 2, 3, 4, 5] as const;
      `,
      check: (tsResult, reactResult) => {
        // Проверяем colors
        expect(tsResult.variables.colors?.typeAssertion).toBeDefined();
        expect(reactResult.variables.colors?.typeAssertion).toBeDefined();
        expect(tsResult.variables.colors.typeAssertion.operator).toBe("as");
        expect(reactResult.variables.colors.typeAssertion.operator).toBe("as");
        expect(tsResult.variables.colors.typeAssertion.type).toBe("const");
        expect(reactResult.variables.colors.typeAssertion.type).toBe("const");

        // Проверяем statusList
        expect(tsResult.variables.statusList?.typeAssertion).toBeDefined();
        expect(reactResult.variables.statusList?.typeAssertion).toBeDefined();
        expect(tsResult.variables.statusList.typeAssertion.type).toBe("const");
        expect(reactResult.variables.statusList.typeAssertion.type).toBe(
          "const"
        );

        // Проверяем numbers
        expect(tsResult.variables.numbers?.typeAssertion).toBeDefined();
        expect(reactResult.variables.numbers?.typeAssertion).toBeDefined();
        expect(tsResult.variables.numbers.typeAssertion.type).toBe("const");
        expect(reactResult.variables.numbers.typeAssertion.type).toBe("const");
      },
    },

    // === BASIC TYPE ASSERTIONS ===
    {
      name: "Basic type assertions",
      tsContent: `
        const stringValue = "hello" as string;
        const numberValue = 42 as number;
        const booleanValue = true as boolean;
        const anyValue = "test" as any;
      `,
      reactContent: `
        const stringValue = "hello" as string;
        const numberValue = 42 as number;
        const booleanValue = true as boolean;
        const anyValue = "test" as any;
      `,
      check: (tsResult, reactResult) => {
        // Проверяем stringValue
        expect(tsResult.variables.stringValue?.typeAssertion).toBeDefined();
        expect(reactResult.variables.stringValue?.typeAssertion).toBeDefined();
        expect(tsResult.variables.stringValue.typeAssertion.type).toBe(
          "string"
        );
        expect(reactResult.variables.stringValue.typeAssertion.type).toBe(
          "string"
        );

        // Проверяем numberValue
        expect(tsResult.variables.numberValue?.typeAssertion).toBeDefined();
        expect(reactResult.variables.numberValue?.typeAssertion).toBeDefined();
        expect(tsResult.variables.numberValue.typeAssertion.type).toBe(
          "number"
        );
        expect(reactResult.variables.numberValue.typeAssertion.type).toBe(
          "number"
        );

        // Проверяем anyValue
        expect(tsResult.variables.anyValue?.typeAssertion).toBeDefined();
        expect(reactResult.variables.anyValue?.typeAssertion).toBeDefined();
        expect(tsResult.variables.anyValue.typeAssertion.type).toBe("any");
        expect(reactResult.variables.anyValue.typeAssertion.type).toBe("any");
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
          JSON.stringify(tsResult.variables, null, 2)
        );
        console.log(
          `React Result for ${tc.name}:`,
          JSON.stringify(reactResult.variables, null, 2)
        );
        throw error;
      }

      cleanupTempDir(tsFile);
      cleanupTempDir(reactFile);
    });
  });
});
