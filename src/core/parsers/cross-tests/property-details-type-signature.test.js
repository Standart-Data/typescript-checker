import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser Property Details & Type Signature Consistency", () => {
  it("should parse interface propertyDetails consistently between parsers", () => {
    const content = `
      interface UserProps {
        name: string;
        age: number;
        email?: string;
        phone?: string;
        isActive: boolean;
      }
    `;

    const tsFile = createTempFileWithContent(content, ".ts");
    const reactFile = createTempFileWithContent(content, ".tsx");

    const tsResult = parseTypeScript([tsFile]);
    const reactResult = parseReact([reactFile]);

    // Проверяем что оба парсера создают propertyDetails
    const tsInterface = tsResult.interfaces.UserProps;
    const reactInterface = reactResult.interfaces.UserProps;

    expect(tsInterface).toBeDefined();
    expect(reactInterface).toBeDefined();

    // Проверяем что propertyDetails одинаковы
    expect(tsInterface.propertyDetails).toBeDefined();
    expect(reactInterface.propertyDetails).toBeDefined();
    expect(tsInterface.propertyDetails).toHaveLength(5);
    expect(reactInterface.propertyDetails).toHaveLength(5);

    // Проверяем конкретные поля
    const tsEmailProp = tsInterface.propertyDetails.find(
      (p) => p.name === "email"
    );
    const reactEmailProp = reactInterface.propertyDetails.find(
      (p) => p.name === "email"
    );

    expect(tsEmailProp).toBeDefined();
    expect(reactEmailProp).toBeDefined();
    expect(tsEmailProp.optional).toBe(true);
    expect(reactEmailProp.optional).toBe(true);
    expect(tsEmailProp.type).toBe("string");
    expect(reactEmailProp.type).toBe("string");
    expect(tsEmailProp.typeString).toBe("email?: string");
    expect(reactEmailProp.typeString).toBe("email?: string");

    // Проверяем обязательные поля
    const tsNameProp = tsInterface.propertyDetails.find(
      (p) => p.name === "name"
    );
    const reactNameProp = reactInterface.propertyDetails.find(
      (p) => p.name === "name"
    );

    expect(tsNameProp.optional).toBe(false);
    expect(reactNameProp.optional).toBe(false);
    expect(tsNameProp.typeString).toBe("name: string");
    expect(reactNameProp.typeString).toBe("name: string");

    // Проверяем обратную совместимость
    expect(tsInterface.properties).toBeDefined();
    expect(reactInterface.properties).toBeDefined();
    expect(tsInterface.properties.email).toBe("string");
    expect(reactInterface.properties.email).toBe("string");

    cleanupTempDir(tsFile);
    cleanupTempDir(reactFile);
  });

  it("should parse variable typeSignature consistently between parsers", () => {
    const content = `
      const userName: string = "John";
      const userAge: number = 30;
      const processor: (data: string) => string = (data) => data.toUpperCase();
      const userData: { name: string; age?: number } = { name: "John" };
      const implicitValue = "hello";
    `;

    const tsFile = createTempFileWithContent(content, ".ts");
    const reactFile = createTempFileWithContent(content, ".tsx");

    const tsResult = parseTypeScript([tsFile]);
    const reactResult = parseReact([reactFile]);

    // Проверяем простые типы
    expect(tsResult.variables.userName.typeSignature).toBe("string");
    expect(reactResult.variables.userName.typeSignature).toBe("string");

    expect(tsResult.variables.userAge.typeSignature).toBe("number");
    expect(reactResult.variables.userAge.typeSignature).toBe("number");

    // Проверяем функциональные типы
    expect(tsResult.variables.processor.typeSignature).toBe(
      "(data: string) => string"
    );
    expect(reactResult.variables.processor.typeSignature).toBe(
      "(data: string) => string"
    );

    // Проверяем объектные типы
    expect(tsResult.variables.userData.typeSignature).toContain("name: string");
    expect(reactResult.variables.userData.typeSignature).toContain(
      "name: string"
    );
    expect(tsResult.variables.userData.typeSignature).toContain("age?: number");
    expect(reactResult.variables.userData.typeSignature).toContain(
      "age?: number"
    );

    // Проверяем неявную типизацию
    expect(tsResult.variables.implicitValue.typeSignature).toBeNull();
    expect(reactResult.variables.implicitValue.typeSignature).toBeNull();

    cleanupTempDir(tsFile);
    cleanupTempDir(reactFile);
  });

  it("should parse FunctionComponent typeSignature consistently between parsers", () => {
    const content = `
      import React, { FunctionComponent } from 'react';
      
      interface Props {
        title: string;
        count?: number;
      }
      
      const MyComponent: FunctionComponent<Props> = ({ title, count = 0 }) => {
        return <div>{title}: {count}</div>;
      };
    `;

    const tsFile = createTempFileWithContent(content, ".ts");
    const reactFile = createTempFileWithContent(content, ".tsx");

    const tsResult = parseTypeScript([tsFile]);
    const reactResult = parseReact([reactFile]);

    // Проверяем интерфейс Props в обоих парсерах
    const tsProps = tsResult.interfaces.Props;
    const reactProps = reactResult.interfaces.Props;

    expect(tsProps).toBeDefined();
    expect(reactProps).toBeDefined();

    // Проверяем propertyDetails
    expect(tsProps.propertyDetails).toBeDefined();
    expect(reactProps.propertyDetails).toBeDefined();

    const tsCountProp = tsProps.propertyDetails.find((p) => p.name === "count");
    const reactCountProp = reactProps.propertyDetails.find(
      (p) => p.name === "count"
    );

    expect(tsCountProp.optional).toBe(true);
    expect(reactCountProp.optional).toBe(true);

    // TypeScript парсер видит MyComponent как переменную
    expect(tsResult.variables.MyComponent).toBeDefined();
    expect(tsResult.variables.MyComponent.typeSignature).toBe(
      "FunctionComponent<Props>"
    );

    // React парсер обрабатывает как компонент и переменную
    expect(reactResult.functions.MyComponent).toBeDefined();
    expect(reactResult.functions.MyComponent.typeSignature).toBe(
      "FunctionComponent<Props>"
    );

    cleanupTempDir(tsFile);
    cleanupTempDir(reactFile);
  });

  it("should handle complex interface with mixed optional/required fields consistently", () => {
    const content = `
      interface ComplexInterface {
        id: string;
        name: string;
        metadata?: {
          createdAt: Date;
          updatedAt?: Date;
          tags?: string[];
        };
        options: {
          enabled: boolean;
          priority?: number;
        };
        callback?: (data: any) => void;
      }
    `;

    const tsFile = createTempFileWithContent(content, ".ts");
    const reactFile = createTempFileWithContent(content, ".tsx");

    const tsResult = parseTypeScript([tsFile]);
    const reactResult = parseReact([reactFile]);

    const tsInterface = tsResult.interfaces.ComplexInterface;
    const reactInterface = reactResult.interfaces.ComplexInterface;

    expect(tsInterface).toBeDefined();
    expect(reactInterface).toBeDefined();

    // Проверяем что количество свойств одинаково
    expect(tsInterface.propertyDetails).toHaveLength(5);
    expect(reactInterface.propertyDetails).toHaveLength(5);

    // Проверяем опциональные поля
    const tsMetadataProp = tsInterface.propertyDetails.find(
      (p) => p.name === "metadata"
    );
    const reactMetadataProp = reactInterface.propertyDetails.find(
      (p) => p.name === "metadata"
    );

    expect(tsMetadataProp.optional).toBe(true);
    expect(reactMetadataProp.optional).toBe(true);
    expect(tsMetadataProp.typeString).toContain("metadata?:");
    expect(reactMetadataProp.typeString).toContain("metadata?:");

    const tsCallbackProp = tsInterface.propertyDetails.find(
      (p) => p.name === "callback"
    );
    const reactCallbackProp = reactInterface.propertyDetails.find(
      (p) => p.name === "callback"
    );

    expect(tsCallbackProp.optional).toBe(true);
    expect(reactCallbackProp.optional).toBe(true);
    expect(tsCallbackProp.typeString).toContain("callback?:");
    expect(reactCallbackProp.typeString).toContain("callback?:");

    // Проверяем обязательные поля
    const tsIdProp = tsInterface.propertyDetails.find((p) => p.name === "id");
    const reactIdProp = reactInterface.propertyDetails.find(
      (p) => p.name === "id"
    );

    expect(tsIdProp.optional).toBe(false);
    expect(reactIdProp.optional).toBe(false);
    expect(tsIdProp.typeString).toBe("id: string");
    expect(reactIdProp.typeString).toBe("id: string");

    cleanupTempDir(tsFile);
    cleanupTempDir(reactFile);
  });
});
