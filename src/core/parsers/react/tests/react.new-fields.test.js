import { describe, it, expect } from "vitest";
import { parseReact } from "../parseReact";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../../tests/testUtils";

describe("React Parser - New Fields (propertyDetails & typeSignature)", () => {
  it("should parse interface propertyDetails with optional fields", () => {
    const content = `
      import React from 'react';
      
      export interface UserProfileProps {
        name: string;
        age: number;
        email?: string;
        phone?: string;
        isActive: boolean;
      }
      
      interface ComponentProps {
        title: string;
        subtitle?: string;
        count: number;
        tags?: string[];
        metadata?: { createdAt: Date };
      }
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем UserProfileProps
    const userProps = result.interfaces.UserProfileProps;
    expect(userProps).toBeDefined();
    expect(userProps.propertyDetails).toBeDefined();
    expect(userProps.propertyDetails).toHaveLength(5);

    // Проверяем обязательные поля
    const nameProperty = userProps.propertyDetails.find(
      (p) => p.name === "name"
    );
    expect(nameProperty).toBeDefined();
    expect(nameProperty.type).toBe("string");
    expect(nameProperty.optional).toBe(false);
    expect(nameProperty.typeString).toBe("name: string");

    const ageProperty = userProps.propertyDetails.find((p) => p.name === "age");
    expect(ageProperty).toBeDefined();
    expect(ageProperty.type).toBe("number");
    expect(ageProperty.optional).toBe(false);
    expect(ageProperty.typeString).toBe("age: number");

    // Проверяем опциональные поля
    const emailProperty = userProps.propertyDetails.find(
      (p) => p.name === "email"
    );
    expect(emailProperty).toBeDefined();
    expect(emailProperty.type).toBe("string");
    expect(emailProperty.optional).toBe(true);
    expect(emailProperty.typeString).toBe("email?: string");

    const phoneProperty = userProps.propertyDetails.find(
      (p) => p.name === "phone"
    );
    expect(phoneProperty).toBeDefined();
    expect(phoneProperty.type).toBe("string");
    expect(phoneProperty.optional).toBe(true);
    expect(phoneProperty.typeString).toBe("phone?: string");

    const isActiveProperty = userProps.propertyDetails.find(
      (p) => p.name === "isActive"
    );
    expect(isActiveProperty).toBeDefined();
    expect(isActiveProperty.type).toBe("boolean");
    expect(isActiveProperty.optional).toBe(false);
    expect(isActiveProperty.typeString).toBe("isActive: boolean");

    // Проверяем обратную совместимость
    expect(userProps.properties).toBeDefined();
    expect(userProps.properties.name).toBe("string");
    expect(userProps.properties.email).toBe("string");

    // Проверяем ComponentProps с более сложными типами
    const componentProps = result.interfaces.ComponentProps;
    expect(componentProps).toBeDefined();
    expect(componentProps.propertyDetails).toBeDefined();
    expect(componentProps.propertyDetails).toHaveLength(5);

    // Проверяем массив как опциональный тип
    const tagsProperty = componentProps.propertyDetails.find(
      (p) => p.name === "tags"
    );
    expect(tagsProperty).toBeDefined();
    expect(tagsProperty.type).toBe("string[]");
    expect(tagsProperty.optional).toBe(true);
    expect(tagsProperty.typeString).toBe("tags?: string[]");

    // Проверяем объектный тип как опциональный
    const metadataProperty = componentProps.propertyDetails.find(
      (p) => p.name === "metadata"
    );
    expect(metadataProperty).toBeDefined();
    expect(metadataProperty.optional).toBe(true);
    expect(metadataProperty.typeString).toContain("metadata?:");

    cleanupTempDir(tempFile);
  });

  it("should parse variable typeSignature field in React files", () => {
    const content = `
      import React from 'react';
      
      // Переменные с явной типизацией
      const userName: string = "John";
      const userAge: number = 30;
      const isActive: boolean = true;
      
      // Функциональные переменные с типизацией
      const processor: (data: string) => string = (data) => data.toUpperCase();
      const validator: (input: any) => boolean = (input) => !!input;
      
      // Сложные типы
      const userData: { name: string; age: number; email?: string } = {
        name: "John",
        age: 30
      };
      
      // Type alias
      type UserProcessor = (user: any) => string;
      const userProcessor: UserProcessor = (user) => user.name;
      
      // Без явной типизации (должно быть null)
      const implicitString = "hello";
      const implicitNumber = 42;
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем простые типы
    expect(result.variables.userName).toBeDefined();
    expect(result.variables.userName.typeSignature).toBe("string");

    expect(result.variables.userAge).toBeDefined();
    expect(result.variables.userAge.typeSignature).toBe("number");

    expect(result.variables.isActive).toBeDefined();
    expect(result.variables.isActive.typeSignature).toBe("boolean");

    // Проверяем функциональные типы
    expect(result.variables.processor).toBeDefined();
    expect(result.variables.processor.typeSignature).toBe(
      "(data: string) => string"
    );

    expect(result.variables.validator).toBeDefined();
    expect(result.variables.validator.typeSignature).toBe(
      "(input: any) => boolean"
    );

    // Проверяем объектные типы
    expect(result.variables.userData).toBeDefined();
    expect(result.variables.userData.typeSignature).toContain("name: string");
    expect(result.variables.userData.typeSignature).toContain("age: number");
    expect(result.variables.userData.typeSignature).toContain("email?: string");

    // Проверяем type alias
    expect(result.variables.userProcessor).toBeDefined();
    expect(result.variables.userProcessor.typeSignature).toBe("UserProcessor");

    // Проверяем что для неявной типизации typeSignature равно null
    expect(result.variables.implicitString).toBeDefined();
    expect(result.variables.implicitString.typeSignature).toBeNull();

    expect(result.variables.implicitNumber).toBeDefined();
    expect(result.variables.implicitNumber.typeSignature).toBeNull();

    cleanupTempDir(tempFile);
  });

  it("should parse React functional component typeSignature with FunctionComponent", () => {
    const content = `
      import React, { FunctionComponent } from 'react';
      
      interface UserProfileProps {
        name: string;
        age: number;
        email?: string;
      }
      
      // Функциональный компонент с типизацией FunctionComponent
      const UserProfile: FunctionComponent<UserProfileProps> = ({ name, age, email }) => {
        return (
          <div>
            <h1>{name}</h1>
            <p>Age: {age}</p>
            {email && <p>Email: {email}</p>}
          </div>
        );
      };
      
      // Обычная функция (не компонент)
      const processData: (data: string) => string = (data) => data.trim();
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // В React парсере компоненты обрабатываются отдельно и находятся только в functions
    // Проверяем функциональный компонент в functions
    expect(result.functions.UserProfile).toBeDefined();
    expect(result.functions.UserProfile.typeSignature).toBe(
      "FunctionComponent<UserProfileProps>"
    );

    // Проверяем jsx поле для компонента
    expect(result.functions.UserProfile.jsx).toBe(true);
    expect(result.functions.UserProfile.returnType).toBe("JSX.Element");

    // Проверяем обычную функцию (она должна быть и в variables и в functions)
    expect(result.variables.processData).toBeDefined();
    expect(result.variables.processData.typeSignature).toBe(
      "(data: string) => string"
    );

    expect(result.functions.processData).toBeDefined();
    expect(result.functions.processData.typeSignature).toBe(
      "(data: string) => string"
    );

    cleanupTempDir(tempFile);
  });

  it("should preserve backward compatibility with old properties field in React", () => {
    const content = `
      import React from 'react';
      
      export interface ReactBackwardCompatible {
        required: string;
        optional?: number;
        another: boolean;
      }
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const iface = result.interfaces.ReactBackwardCompatible;
    expect(iface).toBeDefined();

    // Проверяем что старое поле properties всё ещё работает
    expect(iface.properties).toBeDefined();
    expect(iface.properties.required).toBe("string");
    expect(iface.properties.optional).toBe("number");
    expect(iface.properties.another).toBe("boolean");

    // Проверяем что новое поле propertyDetails также работает
    expect(iface.propertyDetails).toBeDefined();
    expect(iface.propertyDetails).toHaveLength(3);

    // Проверяем что данные согласованы
    const requiredDetail = iface.propertyDetails.find(
      (p) => p.name === "required"
    );
    expect(requiredDetail.type).toBe(iface.properties.required);
    expect(requiredDetail.optional).toBe(false);

    const optionalDetail = iface.propertyDetails.find(
      (p) => p.name === "optional"
    );
    expect(optionalDetail.type).toBe(iface.properties.optional);
    expect(optionalDetail.optional).toBe(true);

    cleanupTempDir(tempFile);
  });

  it("should correctly parse mixed React components and interfaces", () => {
    const content = `
      import React, { FunctionComponent } from 'react';
      
      // Интерфейс с опциональными полями
      interface CardProps {
        title: string;
        subtitle?: string;
        description: string;
        footer?: React.ReactNode;
      }
      
      // Компонент с типизацией
      const Card: FunctionComponent<CardProps> = ({ title, subtitle, description, footer }) => {
        return (
          <div className="card">
            <h2>{title}</h2>
            {subtitle && <h3>{subtitle}</h3>}
            <p>{description}</p>
            {footer && <div className="footer">{footer}</div>}
          </div>
        );
      };
      
      // Функция-хелпер с типизацией
      const formatCardData: (props: CardProps) => string = (props) => {
        return \`\${props.title}: \${props.description}\`;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем интерфейс
    const cardProps = result.interfaces.CardProps;
    expect(cardProps).toBeDefined();
    expect(cardProps.propertyDetails).toBeDefined();
    expect(cardProps.propertyDetails).toHaveLength(4);

    // Проверяем опциональные поля интерфейса
    const subtitleProp = cardProps.propertyDetails.find(
      (p) => p.name === "subtitle"
    );
    expect(subtitleProp).toBeDefined();
    expect(subtitleProp.optional).toBe(true);
    expect(subtitleProp.typeString).toBe("subtitle?: string");

    const footerProp = cardProps.propertyDetails.find(
      (p) => p.name === "footer"
    );
    expect(footerProp).toBeDefined();
    expect(footerProp.optional).toBe(true);
    expect(footerProp.typeString).toContain("footer?:");

    // Проверяем компонент
    expect(result.functions.Card).toBeDefined();
    expect(result.functions.Card.typeSignature).toBe(
      "FunctionComponent<CardProps>"
    );
    expect(result.functions.Card.jsx).toBe(true);

    // Проверяем хелпер-функцию
    expect(result.functions.formatCardData).toBeDefined();
    expect(result.functions.formatCardData.typeSignature).toBe(
      "(props: CardProps) => string"
    );

    cleanupTempDir(tempFile);
  });
});
