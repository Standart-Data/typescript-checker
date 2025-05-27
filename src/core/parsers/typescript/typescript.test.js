import { describe, it, expect } from "vitest";
import { parseTypeScript } from "./parseTypeScript";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

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

  it("should parse class with constructor overloads (backward compatibility)", () => {
    const content = `
      class Computer {
        private id: number;
        protected name: string;
        public model: string;
        public version: string;
        public color: string = 'blue';

        constructor(name: string, model: string, version: string, color: string)
        constructor(name: string, model: string, version: string, id: number)
        constructor(name: string, model: string, version: string, someThing: string | number) {
          this.name = name;
          this.version = version;
          this.model = model;
          if (typeof someThing === 'number') {
            this.id = someThing;
          } else {
            this.color = someThing;
          }
        }
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const computerClass = result.classes.Computer;
    expect(computerClass).toBeDefined();

    // Проверяем новый формат свойств
    expect(computerClass.properties.id).toBeDefined();
    expect(computerClass.properties.id.accessModifier).toBe("private");
    expect(computerClass.properties.name.accessModifier).toBe("protected");
    expect(computerClass.properties.model.accessModifier).toBe("public");

    // Проверяем обратную совместимость - свойства прямо в классе
    expect(computerClass.id).toBeDefined();
    expect(computerClass.id.modificator).toBe("private");
    expect(computerClass.id.types).toEqual(["number"]);

    expect(computerClass.name.modificator).toBe("protected");
    expect(computerClass.name.types).toEqual(["string"]);

    expect(computerClass.model.modificator).toBe("opened");
    expect(computerClass.model.types).toEqual(["string"]);

    expect(computerClass.color.value).toBe("blue");

    // Проверяем обратную совместимость конструкторов
    expect(computerClass.constructor).toBeDefined();
    expect(computerClass.constructor.params).toHaveLength(4);
    expect(computerClass.constructor.body).toContain("this.name = name");

    expect(computerClass.constructorSignature0).toBeDefined();
    expect(computerClass.constructorSignature0.params).toHaveLength(4);
    expect(Object.keys(computerClass.constructorSignature0.params[3])[0]).toBe(
      "color"
    );
    expect(computerClass.constructorSignature0.params[3].color.types).toEqual([
      "string",
    ]);

    expect(computerClass.constructorSignature1).toBeDefined();
    expect(computerClass.constructorSignature1.params).toHaveLength(4);
    expect(Object.keys(computerClass.constructorSignature1.params[3])[0]).toBe(
      "id"
    );
    expect(computerClass.constructorSignature1.params[3].id.types).toEqual([
      "number",
    ]);

    // Проверяем новые поля
    expect(computerClass.isAbstract).toBe(false);
    expect(computerClass.isExported).toBe(false);

    cleanupTempDir(tempFile);
  });

  it("should parse namespace with isExported flag", () => {
    const content = `
      export namespace Utils {
        export function helper(): string {
          return 'helper';
        }
        export const constant = 42;
      }

      namespace InternalUtils {
        function internalHelper(): void {}
        const internalConstant = 'secret';
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем экспортируемый namespace
    expect(result.namespaces.Utils).toBeDefined();
    expect(result.namespaces.Utils.isExported).toBe(true);
    expect(result.namespaces.Utils.functions.helper).toBeDefined();
    expect(result.namespaces.Utils.variables.constant).toBeDefined();

    // Проверяем внутренний namespace
    expect(result.namespaces.InternalUtils).toBeDefined();
    expect(result.namespaces.InternalUtils.isExported).toBe(false);
    expect(
      result.namespaces.InternalUtils.functions.internalHelper
    ).toBeDefined();
    expect(
      result.namespaces.InternalUtils.variables.internalConstant
    ).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse class with extends and implements", () => {
    const content = `
      abstract class AbstractBase {
        abstract abstractMethod(): void;
        public publicMethod(): void {}
      }

      interface IInterface {
        interfaceMethod(): string;
      }

      export class ConcreteClass extends AbstractBase implements IInterface {
        constructor(public value: string) {
          super();
        }

        abstractMethod(): void {
          console.log("implemented");
        }

        interfaceMethod(): string {
          return this.value;
        }
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const abstractBase = result.classes.AbstractBase;
    expect(abstractBase.isAbstract).toBe(true);
    expect(abstractBase.isExported).toBe(false);

    const concreteClass = result.classes.ConcreteClass;
    expect(concreteClass.isExported).toBe(true);
    expect(concreteClass.extends).toEqual(["AbstractBase"]);
    expect(concreteClass.implements).toEqual(["IInterface"]);
    expect(concreteClass.extendedClasses).toEqual(["AbstractBase"]);

    // Проверяем конструктор с параметрами-свойствами
    expect(concreteClass.constructor).toBeDefined();
    expect(concreteClass.constructor.params).toHaveLength(1);
    expect(Object.keys(concreteClass.constructor.params[0])[0]).toBe("value");

    cleanupTempDir(tempFile);
  });

  it("should parse class with decorators and access modifiers", () => {
    const content = `
      class DecoratedClass {
        private decoratedProperty: string = "value";
        public decoratedMethod(param: string): void {}
        static staticMethod(): void {}
        readonly readonlyProperty: number = 42;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const decoratedClass = result.classes.DecoratedClass;
    expect(decoratedClass).toBeDefined();

    const decoratedProperty = decoratedClass.properties.decoratedProperty;
    expect(decoratedProperty.accessModifier).toBe("private");
    expect(decoratedProperty.type).toBe("string");
    expect(decoratedProperty.initializer).toBe('"value"');

    const decoratedMethod = decoratedClass.methods.decoratedMethod;
    expect(decoratedMethod.accessModifier).toBe("public");
    expect(decoratedMethod.parameters).toHaveLength(1);
    expect(decoratedMethod.parameters[0].name).toBe("param");
    expect(decoratedMethod.parameters[0].type).toBe("string");

    const staticMethod = decoratedClass.methods.staticMethod;
    expect(staticMethod.isStatic).toBe(true);
    expect(staticMethod.accessModifier).toBe("public");

    const readonlyProperty = decoratedClass.properties.readonlyProperty;
    expect(readonlyProperty.isReadonly).toBe(true);
    expect(readonlyProperty.accessModifier).toBe("public");

    // Проверяем обратную совместимость свойств
    expect(decoratedClass.decoratedProperty.modificator).toBe("private");
    expect(decoratedClass.readonlyProperty.modificator).toBe("opened");

    cleanupTempDir(tempFile);
  });

  it("should parse functions with generators and async modifiers", () => {
    const content = `
      export async function asyncFunction(): Promise<void> {}
      
      export function* generatorFunction(): Generator<number> {
        yield 1;
      }
      
      export default function defaultFunction(): string {
        return "default";
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const asyncFunc = result.functions.asyncFunction;
    expect(asyncFunc.isAsync).toBe(true);
    expect(asyncFunc.isExported).toBe(true);
    expect(asyncFunc.isGenerator).toBe(false);

    const generatorFunc = result.functions.generatorFunction;
    expect(generatorFunc.isGenerator).toBe(true);
    expect(generatorFunc.isExported).toBe(true);
    expect(generatorFunc.isAsync).toBe(false);

    const defaultFunc = result.functions.defaultFunction;
    expect(defaultFunc.isDefault).toBe(true);
    expect(defaultFunc.isExported).toBe(true);

    cleanupTempDir(tempFile);
  });

  it("should parse enums with const modifier", () => {
    const content = `
      export enum RegularEnum {
        First = "first",
        Second = "second"
      }
      
      const enum ConstEnum {
        First = 1,
        Second = 2
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const regularEnum = result.enums.RegularEnum;
    expect(regularEnum.isConst).toBe(false);
    expect(regularEnum.isExported).toBe(true);
    expect(regularEnum.members).toHaveLength(2);

    const constEnum = result.enums.ConstEnum;
    expect(constEnum.isConst).toBe(true);
    expect(constEnum.isExported).toBe(false);
    expect(constEnum.members).toHaveLength(2);

    cleanupTempDir(tempFile);
  });

  // Добавьте другие тесты для различных конструкций TypeScript
});
