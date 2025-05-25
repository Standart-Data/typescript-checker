import { describe, it, expect } from "vitest";
import { parseTypeScript } from "./typescript";
import { createTempFileWithContent, cleanupTempDir } from "../tests/testUtils";

describe("parseTypeScript", () => {
  it("should return an empty structure for an empty file", () => {
    const tempFile = createTempFileWithContent("");
    const result = parseTypeScript([tempFile]);

    expect(result).toEqual({
      functions: {},
      variables: {},
      classes: {},
      interfaces: {},
      types: {},
      enums: {},
      imports: {},
      exports: {},
      declarations: {},
      modules: {},
      namespaces: {},
    });

    cleanupTempDir(tempFile);
  });

  it("should parse a simple variable declaration", () => {
    const content = 'const greeting: string = "Hello, world!";';
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    expect(result.variables.greeting).toBeDefined();
    expect(result.variables.greeting.name).toBe("greeting");
    expect(result.variables.greeting.type).toBe("string");
    expect(result.variables.greeting.isConst).toBe(true);
    expect(result.variables.greeting.declarationType).toBe("const");
    expect(result.variables.greeting.initializerValue).toBe('"Hello, world!"');

    cleanupTempDir(tempFile);
  });

  // Добавьте другие тесты для различных конструкций TypeScript
});
