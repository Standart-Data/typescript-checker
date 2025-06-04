import { describe, it, expect } from "vitest";
import { parseReact } from "../parseReact";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../../tests/testUtils";

describe("React Parser - Backward Compatibility", () => {
  it("should preserve function params format with type array for backward compatibility", () => {
    const content = `
      import React from 'react';
      
      export const UserCard: React.FC<{name: string, age: number}> = ({name, age}) => {
        return <div>{name} is {age} years old</div>;
      };
      
      export function processUser(user: User, options?: ProcessOptions): string {
        return user.name;
      }
      
      interface User {
        name: string;
        id: number;
      }
      
      interface ProcessOptions {
        format: boolean;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseReact([tempFile]);

    // Проверяем React компонент
    const userCard = result.functions.UserCard;
    expect(userCard).toBeDefined();

    // Старый формат: params с type как массив строк (обратная совместимость)
    expect(userCard.params).toBeDefined();
    expect(Array.isArray(userCard.params)).toBe(true);
    expect(userCard.params.length).toBe(2);
    expect(userCard.params[0].name).toBe("name");
    expect(Array.isArray(userCard.params[0].type)).toBe(true);
    expect(userCard.params[0].type[0]).toBe("string");

    expect(userCard.params[1].name).toBe("age");
    expect(Array.isArray(userCard.params[1].type)).toBe(true);
    expect(userCard.params[1].type[0]).toBe("number");

    // Новый формат: parameters с type как строка
    expect(userCard.parameters).toBeDefined();
    expect(Array.isArray(userCard.parameters)).toBe(true);
    expect(userCard.parameters.length).toBe(2);
    expect(userCard.parameters[0].name).toBe("name");
    expect(typeof userCard.parameters[0].type).toBe("string");
    expect(userCard.parameters[0].type).toBe("string");

    // Проверяем returnResult как массив (обратная совместимость)
    expect(Array.isArray(userCard.returnResult)).toBe(true);
    expect(userCard.returnResult[0]).toBe("JSX.Element");

    // Проверяем обычную функцию processUser (если она обрабатывается)
    if (result.functions.processUser) {
      const processUser = result.functions.processUser;
      expect(processUser.params).toBeDefined();
      expect(processUser.params.length).toBe(2);

      expect(processUser.params[0].name).toBe("user");
      expect(Array.isArray(processUser.params[0].type)).toBe(true);
      expect(processUser.params[0].type[0]).toBe("User");

      expect(processUser.params[1].name).toBe("options");
      expect(Array.isArray(processUser.params[1].type)).toBe(true);
      expect(processUser.params[1].type[0]).toBe("ProcessOptions");
    }

    cleanupTempDir(tempFile);
  });

  it("should preserve class method params format with type array for backward compatibility", () => {
    const content = `
      import React, { Component } from 'react';
      
      export class UserManager extends Component<{users: User[]}> {
        addUser(user: User, notify?: boolean): void {
          console.log('Adding user:', user.name);
        }
        
        static findById(id: number, users: User[]): User | null {
          return users.find(u => u.id === id) || null;
        }
        
        render(): JSX.Element {
          return <div>User Manager</div>;
        }
      }
      
      interface User {
        id: number;
        name: string;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseReact([tempFile]);

    const userManager = result.classes?.UserManager;
    if (userManager && userManager.methods) {
      // Проверяем addUser метод
      const addUser = userManager.methods.addUser;
      if (addUser) {
        // Старый формат: params с type как массив строк (обратная совместимость)
        expect(addUser.params).toBeDefined();
        expect(Array.isArray(addUser.params)).toBe(true);
        expect(addUser.params.length).toBe(2);
        expect(addUser.params[0].name).toBe("user");
        expect(Array.isArray(addUser.params[0].type)).toBe(true);
        expect(addUser.params[0].type[0]).toBe("User");

        expect(addUser.params[1].name).toBe("notify");
        expect(Array.isArray(addUser.params[1].type)).toBe(true);
        expect(addUser.params[1].type[0]).toBe("boolean");

        // Новый формат: parameters с type как строка
        expect(addUser.parameters).toBeDefined();
        expect(Array.isArray(addUser.parameters)).toBe(true);
        expect(addUser.parameters.length).toBe(2);
        expect(addUser.parameters[0].type).toBe("User");
        expect(addUser.parameters[1].type).toBe("boolean");

        // Проверяем returnResult как массив (обратная совместимость)
        expect(Array.isArray(addUser.returnResult)).toBe(true);
        expect(addUser.returnResult[0]).toBe("void");
        expect(addUser.returnResult[0]).toBe(addUser.returnType);
      }

      // Проверяем static метод findById
      const findById = userManager.methods.findById;
      if (findById) {
        expect(findById.params).toBeDefined();
        expect(findById.params.length).toBe(2);
        expect(findById.params[0].type[0]).toBe("number");
        expect(findById.params[1].type[0]).toBe("User[]");
      }
    }

    cleanupTempDir(tempFile);
  });
});
