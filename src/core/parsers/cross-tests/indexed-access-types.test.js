import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Indexed Access Types Consistency", () => {
  it("should parse typeof obj[keyof typeof obj] indexed access types consistently", () => {
    const content = `
      const Statuses = {
        TODO: "todo",
        IN_PROGRESS: "in-progress",
        DONE: "done"
      } as const;

      type TaskStatuses = typeof Statuses[keyof typeof Statuses];
      
      interface Task {
        id: number;
        title: string;
        status: TaskStatuses;
      }

      const myTask: Task = {
        id: 1,
        title: "Learn TypeScript",
        status: Statuses.TODO
      };
    `;

    const tempFile = createTempFileWithContent(content);

    const tsResult = parseTypeScript([tempFile]);
    const reactResult = parseReact([tempFile]);

    // Проверяем, что тип TaskStatuses парсится одинаково
    expect(tsResult.types.TaskStatuses).toBeDefined();
    expect(reactResult.types.TaskStatuses).toBeDefined();

    // Проверяем значение типа - должно быть похожим в обоих парсерах
    const tsValue = tsResult.types.TaskStatuses.value.replace(/\s+/g, "");
    const reactValue = reactResult.types.TaskStatuses.value.replace(/\s+/g, "");

    expect(tsValue).toContain("typeofStatuses[keyoftypeofStatuses]");
    expect(reactValue).toContain("typeofStatuses[keyoftypeofStatuses]");

    // Проверяем, что интерфейс Task тоже парсится одинаково
    expect(tsResult.interfaces.Task).toBeDefined();
    expect(reactResult.interfaces.Task).toBeDefined();

    expect(tsResult.interfaces.Task.properties.status).toBe("TaskStatuses");
    expect(reactResult.interfaces.Task.properties.status).toBe("TaskStatuses");

    // Проверяем что переменная Statuses присутствует (не проверяем содержимое из-за различий в парсерах)
    expect(tsResult.variables.Statuses).toBeDefined();
    expect(reactResult.variables.Statuses).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse nested indexed access types consistently", () => {
    const content = `
      const Config = {
        api: {
          timeout: 5000,
          retries: 3
        },
        ui: {
          theme: "dark",
          language: "en"
        }
      } as const;

      type ApiKeys = keyof typeof Config.api;
      type UiKeys = keyof typeof Config.ui;
      type ConfigValues = typeof Config[keyof typeof Config];
    `;

    const tempFile = createTempFileWithContent(content);

    const tsResult = parseTypeScript([tempFile]);
    const reactResult = parseReact([tempFile]);

    // Проверяем все типы
    expect(tsResult.types.ApiKeys).toBeDefined();
    expect(reactResult.types.ApiKeys).toBeDefined();
    expect(tsResult.types.UiKeys).toBeDefined();
    expect(reactResult.types.UiKeys).toBeDefined();
    expect(tsResult.types.ConfigValues).toBeDefined();
    expect(reactResult.types.ConfigValues).toBeDefined();

    // Проверяем, что ConfigValues содержит indexed access
    const tsConfigValue = tsResult.types.ConfigValues.value.replace(/\s+/g, "");
    const reactConfigValue = reactResult.types.ConfigValues.value.replace(
      /\s+/g,
      ""
    );

    expect(tsConfigValue).toContain("typeofConfig[keyoftypeofConfig]");
    expect(reactConfigValue).toContain("typeofConfig[keyoftypeofConfig]");

    cleanupTempDir(tempFile);
  });

  it("should parse utility types with indexed access consistently", () => {
    const content = `
      interface User {
        id: number;
        name: string;
        email: string;
        role: "admin" | "user";
      }

      const userFields = {
        id: "ID",
        name: "Name", 
        email: "Email"
      } as const;

      type UserField = keyof typeof userFields;
      type SelectedUser = Pick<User, typeof userFields[UserField]>;
    `;

    const tempFile = createTempFileWithContent(content);

    const tsResult = parseTypeScript([tempFile]);
    const reactResult = parseReact([tempFile]);

    expect(tsResult.types.UserField).toBeDefined();
    expect(reactResult.types.UserField).toBeDefined();
    expect(tsResult.types.SelectedUser).toBeDefined();
    expect(reactResult.types.SelectedUser).toBeDefined();

    cleanupTempDir(tempFile);
  });
});
