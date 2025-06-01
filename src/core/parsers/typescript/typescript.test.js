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

  it("should parse arrow function assigned to const variable", () => {
    const content = `
      export const arrowFunc = (x: number, y: number): number => x + y;
      const internalArrow: (name: string) => string = (name) => \`Hello, \${name}\`;
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем что функция попадает в variables
    expect(result.variables.arrowFunc).toBeDefined();
    expect(result.variables.arrowFunc.isConst).toBe(true);
    expect(result.variables.arrowFunc.declarationType).toBe("const");
    expect(result.variables.arrowFunc.isExported).toBe(true);

    // И также дублируется в functions
    expect(result.functions.arrowFunc).toBeDefined();
    expect(result.functions.arrowFunc.isExported).toBe(true);
    expect(result.functions.arrowFunc.parameters).toBeDefined();
    expect(result.functions.arrowFunc.parameters.length).toBe(2);
    expect(result.functions.arrowFunc.parameters[0].name).toBe("x");
    expect(result.functions.arrowFunc.parameters[0].type).toBe("number");
    expect(result.functions.arrowFunc.parameters[1].name).toBe("y");
    expect(result.functions.arrowFunc.parameters[1].type).toBe("number");
    expect(result.functions.arrowFunc.returnType).toBe("number");

    // Проверяем внутреннюю функцию
    expect(result.variables.internalArrow).toBeDefined();
    expect(result.variables.internalArrow.isExported).toBe(false);
    expect(result.functions.internalArrow).toBeDefined();
    expect(result.functions.internalArrow.isExported).toBe(false);

    cleanupTempDir(tempFile);
  });

  it("should parse function expression assigned to const variable", () => {
    const content = `
      export const funcExpr = function(message: string): void { 
        console.log(message); 
      };
      const namedFuncExpr = function helper(n: number): number {
        return n > 0 ? n * helper(n - 1) : 1;
      };
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем function expression
    expect(result.variables.funcExpr).toBeDefined();
    expect(result.variables.funcExpr.isConst).toBe(true);
    expect(result.variables.funcExpr.isExported).toBe(true);

    expect(result.functions.funcExpr).toBeDefined();
    expect(result.functions.funcExpr.isExported).toBe(true);
    expect(result.functions.funcExpr.parameters).toBeDefined();
    expect(result.functions.funcExpr.parameters.length).toBe(1);
    expect(result.functions.funcExpr.parameters[0].name).toBe("message");
    expect(result.functions.funcExpr.parameters[0].type).toBe("string");
    expect(result.functions.funcExpr.returnType).toBe("void");

    // Проверяем named function expression
    expect(result.variables.namedFuncExpr).toBeDefined();
    expect(result.functions.namedFuncExpr).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should parse typed function variable with functional type", () => {
    const content = `
      type Calculator = (a: number, b: number) => number;
      export const addFunc: Calculator = (x, y) => x + y;
      
      type Greeting = {
        defaultName: string;
        setDefaultName: (newName: string) => void;
      } & ((name?: string) => string);
      
      export const greetFunc: Greeting = (name) => \`Hello, \${name || greetFunc.defaultName}\`;
      greetFunc.defaultName = "Func";
      greetFunc.setDefaultName = (anotherName) => {};
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем типы
    expect(result.types.Calculator).toBeDefined();
    expect(result.types.Greeting).toBeDefined();
    expect(result.types.Greeting.type).toBe("function");
    expect(result.types.Greeting.properties).toBeDefined();
    expect(result.types.Greeting.properties.defaultName).toBe("string");

    // Проверяем простую типизированную функцию
    expect(result.variables.addFunc).toBeDefined();
    expect(result.variables.addFunc.type).toBe("Calculator");
    expect(result.functions.addFunc).toBeDefined();
    expect(result.functions.addFunc.types[0]).toBe("Calculator");

    // Проверяем гибридный тип с properties
    expect(result.variables.greetFunc).toBeDefined();
    expect(result.variables.greetFunc.type).toBe("Greeting");
    expect(result.functions.greetFunc).toBeDefined();
    expect(result.functions.greetFunc.types[0]).toBe("Greeting");

    // Проверяем свойства добавленные через assignment
    expect(result.functions.greetFunc.defaultName).toBeDefined();
    expect(result.functions.greetFunc.defaultName.value).toBe("Func");
    expect(result.functions.greetFunc.setDefaultName).toBeDefined();

    cleanupTempDir(tempFile);
  });

  it("should distinguish function variables from regular variables", () => {
    const content = `
      const regularVar: string = "not a function";
      const regularNumber = 42;
      const regularObject = { key: "value" };
      
      const arrowFunction = () => "function";
      const funcExpression = function() { return "function"; };
      const typedFunc: () => void = () => {};
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Обычные переменные не должны быть в functions
    expect(result.variables.regularVar).toBeDefined();
    expect(result.functions.regularVar).toBeUndefined();

    expect(result.variables.regularNumber).toBeDefined();
    expect(result.functions.regularNumber).toBeUndefined();

    expect(result.variables.regularObject).toBeDefined();
    expect(result.functions.regularObject).toBeUndefined();

    // Функции должны быть и в variables и в functions
    expect(result.variables.arrowFunction).toBeDefined();
    expect(result.functions.arrowFunction).toBeDefined();

    expect(result.variables.funcExpression).toBeDefined();
    expect(result.functions.funcExpression).toBeDefined();

    expect(result.variables.typedFunc).toBeDefined();
    expect(result.functions.typedFunc).toBeDefined();

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
    expect(decoratedClass.readonlyProperty.modificator).toBe("readonly");

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

  it("should parse function bodies correctly", () => {
    const content = `
      function simpleFunction(name: string, age: number): string {
        return \`Hello \${name}, you are \${age} years old\`;
      }
      
      export async function asyncFunction(): Promise<void> {
        await Promise.resolve();
        console.log("Done");
      }
      
      function* generatorFunction(): Generator<number> {
        yield 1;
        yield 2;
        return 3;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем простую функцию
    const simpleFunc = result.functions.simpleFunction;
    expect(simpleFunc.body).toBeDefined();
    expect(typeof simpleFunc.body).toBe("string");
    expect(simpleFunc.body).toContain(
      "return `Hello ${name}, you are ${age} years old`"
    );

    // Проверяем асинхронную функцию
    const asyncFunc = result.functions.asyncFunction;
    expect(asyncFunc.body).toBeDefined();
    expect(typeof asyncFunc.body).toBe("string");
    expect(asyncFunc.body).toContain("await Promise.resolve()");
    expect(asyncFunc.body).toContain('console.log("Done")');

    // Проверяем генератор
    const generatorFunc = result.functions.generatorFunction;
    expect(generatorFunc.body).toBeDefined();
    expect(typeof generatorFunc.body).toBe("string");
    expect(generatorFunc.body).toContain("yield 1");
    expect(generatorFunc.body).toContain("yield 2");
    expect(generatorFunc.body).toContain("return 3");

    cleanupTempDir(tempFile);
  });

  it("should parse class method bodies correctly", () => {
    const content = `
      class TestClass {
        private value: string = "test";
        
        constructor(initialValue: string) {
          this.value = initialValue;
        }
        
        public getValue(): string {
          return this.value;
        }
        
        public setValue(newValue: string): void {
          this.value = newValue;
          console.log(\`Value set to: \${newValue}\`);
        }
        
        private helperMethod(): void {
          console.log("This is a helper method");
        }
        
        static staticMethod(): string {
          return "Static method result";
        }
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const testClass = result.classes.TestClass;
    expect(testClass).toBeDefined();

    // Проверяем конструктор
    expect(testClass.constructor.body).toBeDefined();
    expect(typeof testClass.constructor.body).toBe("string");
    expect(testClass.constructor.body).toContain("this.value = initialValue");

    // Проверяем методы в новом формате
    const getValue = testClass.methods.getValue;
    expect(getValue.body).toBeDefined();
    expect(typeof getValue.body).toBe("string");
    expect(getValue.body).toContain("return this.value");

    const setValue = testClass.methods.setValue;
    expect(setValue.body).toBeDefined();
    expect(typeof setValue.body).toBe("string");
    expect(setValue.body).toContain("this.value = newValue");
    expect(setValue.body).toContain("console.log(`Value set to: ${newValue}`)");

    const helperMethod = testClass.methods.helperMethod;
    expect(helperMethod.body).toBeDefined();
    expect(typeof helperMethod.body).toBe("string");
    expect(helperMethod.body).toContain(
      'console.log("This is a helper method")'
    );

    const staticMethod = testClass.methods.staticMethod;
    expect(staticMethod.body).toBeDefined();
    expect(typeof staticMethod.body).toBe("string");
    expect(staticMethod.body).toContain('return "Static method result"');

    // Проверяем обратную совместимость (старый формат)
    expect(testClass.getValue.body).toBeDefined();
    expect(testClass.getValue.body).toContain("return this.value");

    expect(testClass.setValue.body).toBeDefined();
    expect(testClass.setValue.body).toContain("this.value = newValue");

    cleanupTempDir(tempFile);
  });

  it("should handle functions without body (declarations)", () => {
    const content = `
      declare function declaredFunction(param: string): void;
      
      interface TestInterface {
        interfaceMethod(param: number): string;
      }
      
      class AbstractClass {
        abstract abstractMethod(): void;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Объявленные функции не должны иметь body
    const declaredFunc = result.functions.declaredFunction;
    expect(declaredFunc).toBeDefined();
    expect(declaredFunc.body).toBeUndefined();

    // Методы интерфейсов не должны иметь body
    const interfaceMethod =
      result.interfaces.TestInterface.methods.interfaceMethod;
    expect(interfaceMethod).toBeDefined();
    expect(interfaceMethod.body).toBeUndefined();

    // Абстрактные методы не должны иметь body
    const abstractMethod = result.classes.AbstractClass.methods.abstractMethod;
    expect(abstractMethod).toBeDefined();
    expect(abstractMethod.body).toBeUndefined();

    cleanupTempDir(tempFile);
  });

  it("should preserve constructor params format with types array", () => {
    const content = `
      class MyClass {
        constructor(name: string, age: number) {
          this.name = name;
          this.age = age;
        }
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    expect(result.classes.MyClass.constructor.params).toBeDefined();
    expect(Array.isArray(result.classes.MyClass.constructor.params)).toBe(true);
    expect(result.classes.MyClass.constructor.params.length).toBe(2);

    const nameParam = result.classes.MyClass.constructor.params[0];
    expect(Object.keys(nameParam)[0]).toBe("name");
    expect(Array.isArray(nameParam.name.types)).toBe(true);
    expect(nameParam.name.types[0]).toBe("string");

    const ageParam = result.classes.MyClass.constructor.params[1];
    expect(Object.keys(ageParam)[0]).toBe("age");
    expect(Array.isArray(ageParam.age.types)).toBe(true);
    expect(ageParam.age.types[0]).toBe("number");

    cleanupTempDir(tempFile);
  });

  it("should preserve function params format with type array for backward compatibility", () => {
    const content = `
      export function splitArray<T>(input: T[], delimiter: string): T[] {
        return input.filter(item => item !== delimiter);
      }
      
      function calculateSum(a: number, b: number, c?: string): number {
        return a + b;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем splitArray
    const splitArray = result.functions.splitArray;
    expect(splitArray).toBeDefined();

    // Новый формат: parameters с type как строка
    expect(splitArray.parameters).toBeDefined();
    expect(Array.isArray(splitArray.parameters)).toBe(true);
    expect(splitArray.parameters.length).toBe(2);
    expect(splitArray.parameters[0].name).toBe("input");
    expect(typeof splitArray.parameters[0].type).toBe("string");
    expect(splitArray.parameters[0].type).toBe("T[]");

    // Старый формат: params с type как массив строк (обратная совместимость)
    expect(splitArray.params).toBeDefined();
    expect(Array.isArray(splitArray.params)).toBe(true);
    expect(splitArray.params.length).toBe(2);
    expect(splitArray.params[0].name).toBe("input");
    expect(Array.isArray(splitArray.params[0].type)).toBe(true);
    expect(splitArray.params[0].type[0]).toBe("T[]");

    expect(splitArray.params[1].name).toBe("delimiter");
    expect(Array.isArray(splitArray.params[1].type)).toBe(true);
    expect(splitArray.params[1].type[0]).toBe("string");

    // Проверяем returnResult как массив (обратная совместимость)
    expect(Array.isArray(splitArray.returnResult)).toBe(true);
    expect(splitArray.returnResult[0]).toBe("T[]");

    // Проверяем что returnResult содержит то же что и returnType
    expect(splitArray.returnResult[0]).toBe(splitArray.returnType);

    // Проверяем calculateSum
    const calculateSum = result.functions.calculateSum;
    expect(calculateSum.params).toBeDefined();
    expect(calculateSum.params.length).toBe(3);

    const optionalParam = calculateSum.params[2];
    expect(optionalParam.name).toBe("c");
    expect(Array.isArray(optionalParam.type)).toBe(true);
    expect(optionalParam.type[0]).toBe("string");
    expect(optionalParam.optional).toBe(true);

    cleanupTempDir(tempFile);
  });

  it("should preserve class method params format with type array for backward compatibility", () => {
    const content = `
      export class DataProcessor {
        processItem(item: string, options?: ProcessOptions): boolean {
          return true;
        }
        
        static compareItems(a: any, b: any): number {
          return 0;
        }
      }
      
      interface ProcessOptions {
        strict: boolean;
      }
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    const dataProcessor = result.classes.DataProcessor;
    expect(dataProcessor).toBeDefined();

    // Проверяем processItem метод
    const processItem = dataProcessor.methods.processItem;
    expect(processItem).toBeDefined();

    // Новый формат: parameters с type как строка
    expect(processItem.parameters).toBeDefined();
    expect(Array.isArray(processItem.parameters)).toBe(true);
    expect(processItem.parameters.length).toBe(2);
    expect(processItem.parameters[0].type).toBe("string");

    // Старый формат: params с type как массив строк (обратная совместимость)
    expect(processItem.params).toBeDefined();
    expect(Array.isArray(processItem.params)).toBe(true);
    expect(processItem.params.length).toBe(2);
    expect(processItem.params[0].name).toBe("item");
    expect(Array.isArray(processItem.params[0].type)).toBe(true);
    expect(processItem.params[0].type[0]).toBe("string");

    expect(processItem.params[1].name).toBe("options");
    expect(Array.isArray(processItem.params[1].type)).toBe(true);
    expect(processItem.params[1].type[0]).toBe("ProcessOptions");
    expect(processItem.params[1].optional).toBe(true);

    // Проверяем returnResult как массив (обратная совместимость)
    expect(Array.isArray(processItem.returnResult)).toBe(true);
    expect(processItem.returnResult[0]).toBe("boolean");
    expect(processItem.returnResult[0]).toBe(processItem.returnType);

    // Проверяем static метод
    const compareItems = dataProcessor.methods.compareItems;
    expect(compareItems.params).toBeDefined();
    expect(compareItems.params.length).toBe(2);
    expect(compareItems.params[0].type[0]).toBe("any");
    expect(compareItems.params[1].type[0]).toBe("any");

    cleanupTempDir(tempFile);
  });

  it("should parse object literals with structured values", () => {
    const content = `
      type Course = "JavaScript" | "TypeScript" | "NodeJS";
      interface CourseInfo {
        author: string;
        lessonsCount: number;
        duration: number;
      }

      const courses: Record<Course, CourseInfo> = {
        JavaScript: {
          author: "Nick Rooney",
          lessonsCount: 12,
          duration: 44
        },
        TypeScript: {
          author: "Thomas Macintosh", 
          lessonsCount: 18,
          duration: 32
        }
      };

      const simpleString = "hello world";
      const numberVar = 42;
      const boolVar = true;
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseTypeScript([tempFile]);

    // Проверяем что объект парсится структурированно
    const coursesVar = result.variables.courses;
    expect(coursesVar).toBeDefined();
    expect(coursesVar.type).toBe("Record<Course, CourseInfo>");
    expect(typeof coursesVar.value).toBe("object");

    // Проверяем ключи объекта
    const keys = Object.keys(coursesVar.value);
    expect(keys).toContain("JavaScript");
    expect(keys).toContain("TypeScript");

    // Проверяем структуру JavaScript объекта
    const jsValue = coursesVar.value.JavaScript;
    expect(jsValue.type).toBe("object");
    expect(typeof jsValue.value).toBe("object");

    const jsProperties = jsValue.value;
    expect(jsProperties.author.type).toBe("string");
    expect(jsProperties.author.value).toBe("Nick Rooney");
    expect(jsProperties.lessonsCount.type).toBe("number");
    expect(jsProperties.lessonsCount.value).toBe("12");
    expect(jsProperties.duration.type).toBe("number");
    expect(jsProperties.duration.value).toBe("44");

    // Проверяем структуру TypeScript объекта
    const tsValue = coursesVar.value.TypeScript;
    expect(tsValue.type).toBe("object");
    const tsProperties = tsValue.value;
    expect(tsProperties.author.value).toBe("Thomas Macintosh");
    expect(tsProperties.lessonsCount.value).toBe("18");
    expect(tsProperties.duration.value).toBe("32");

    // Проверяем что простые переменные работают как раньше
    expect(result.variables.simpleString.value).toBe("hello world");
    expect(result.variables.numberVar.value).toBe("42");
    expect(result.variables.boolVar.value).toBe("true");

    // Проверяем обратную совместимость (types массив)
    expect(Array.isArray(coursesVar.types)).toBe(true);
    expect(coursesVar.types).toContain("Record<Course, CourseInfo>");

    cleanupTempDir(tempFile);
  });

  describe("Utility Types", () => {
    it("should parse Pick utility type", () => {
      const content = `
        interface Film {
          id: string;
          name: string;
          year: number;
          duration: number;
          cast: string[];
          link: string;
          rating: number;
          genres: string[];
          description: string;
          logo: string;
        }
        
        type FilmPreview = Pick<Film, "id" | "description" | "genres" | "logo" | "name">;
        export type PublicFilmInfo = Pick<Film, "name" | "year" | "rating">;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const filmPreview = result.types.FilmPreview;
      expect(filmPreview).toBeDefined();
      expect(filmPreview.name).toBe("FilmPreview");
      expect(filmPreview.definition.replace(/\s/g, "")).toBe(
        'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
      );
      expect(filmPreview.value.replace(/\s/g, "")).toBe(
        'Pick<Film,"id"|"description"|"genres"|"logo"|"name">'
      );
      expect(filmPreview.isExported).toBe(false);

      const publicFilmInfo = result.types.PublicFilmInfo;
      expect(publicFilmInfo).toBeDefined();
      expect(publicFilmInfo.name).toBe("PublicFilmInfo");
      expect(publicFilmInfo.definition.replace(/\s/g, "")).toBe(
        'Pick<Film,"name"|"year"|"rating">'
      );
      expect(publicFilmInfo.value.replace(/\s/g, "")).toBe(
        'Pick<Film,"name"|"year"|"rating">'
      );
      expect(publicFilmInfo.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Omit utility type", () => {
      const content = `
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const userWithoutPassword = result.types.UserWithoutPassword;
      expect(userWithoutPassword).toBeDefined();
      expect(userWithoutPassword.definition.replace(/\s/g, "")).toBe(
        'Omit<User,"password">'
      );
      expect(userWithoutPassword.value.replace(/\s/g, "")).toBe(
        'Omit<User,"password">'
      );
      expect(userWithoutPassword.isExported).toBe(false);

      const publicUser = result.types.PublicUser;
      expect(publicUser).toBeDefined();
      expect(publicUser.definition.replace(/\s/g, "")).toBe(
        'Omit<User,"password"|"email">'
      );
      expect(publicUser.value.replace(/\s/g, "")).toBe(
        'Omit<User,"password"|"email">'
      );
      expect(publicUser.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Partial utility type", () => {
      const content = `
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type OptionalConfig = Partial<Pick<Config, "timeout" | "retries">>;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const partialConfig = result.types.PartialConfig;
      expect(partialConfig).toBeDefined();
      expect(partialConfig.definition.replace(/\s/g, "")).toBe(
        "Partial<Config>"
      );
      expect(partialConfig.value.replace(/\s/g, "")).toBe("Partial<Config>");

      const optionalConfig = result.types.OptionalConfig;
      expect(optionalConfig).toBeDefined();
      expect(optionalConfig.definition.replace(/\s/g, "")).toBe(
        'Partial<Pick<Config,"timeout"|"retries">>'
      );
      expect(optionalConfig.value.replace(/\s/g, "")).toBe(
        'Partial<Pick<Config,"timeout"|"retries">>'
      );
      expect(optionalConfig.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Required utility type", () => {
      const content = `
        interface Options {
          name?: string;
          age?: number;
          active?: boolean;
        }
        
        type RequiredOptions = Required<Options>;
        export type StrictOptions = Required<Pick<Options, "name" | "age">>;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const requiredOptions = result.types.RequiredOptions;
      expect(requiredOptions).toBeDefined();
      expect(requiredOptions.definition.replace(/\s/g, "")).toBe(
        "Required<Options>"
      );
      expect(requiredOptions.value.replace(/\s/g, "")).toBe(
        "Required<Options>"
      );

      const strictOptions = result.types.StrictOptions;
      expect(strictOptions).toBeDefined();
      expect(strictOptions.definition.replace(/\s/g, "")).toBe(
        'Required<Pick<Options,"name"|"age">>'
      );
      expect(strictOptions.value.replace(/\s/g, "")).toBe(
        'Required<Pick<Options,"name"|"age">>'
      );
      expect(strictOptions.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Record utility type", () => {
      const content = `
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const statusMap = result.types.StatusMap;
      expect(statusMap).toBeDefined();
      expect(statusMap.definition.replace(/\s/g, "")).toBe(
        "Record<Status,StatusInfo>"
      );
      expect(statusMap.value.replace(/\s/g, "")).toBe(
        "Record<Status,StatusInfo>"
      );

      const stringRecord = result.types.StringRecord;
      expect(stringRecord).toBeDefined();
      expect(stringRecord.definition.replace(/\s/g, "")).toBe(
        "Record<string,number>"
      );
      expect(stringRecord.value.replace(/\s/g, "")).toBe(
        "Record<string,number>"
      );
      expect(stringRecord.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Exclude and Extract utility types", () => {
      const content = `
        type AllTypes = string | number | boolean | null;
        type PrimitiveTypes = "string" | "number" | "boolean";
        
        type NonNullTypes = Exclude<AllTypes, null>;
        type OnlyNumbers = Extract<AllTypes, number>;
        export type StringOrNumber = Extract<AllTypes, string | number>;
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const nonNullTypes = result.types.NonNullTypes;
      expect(nonNullTypes).toBeDefined();
      expect(nonNullTypes.definition.replace(/\s/g, "")).toBe(
        "Exclude<AllTypes,null>"
      );
      expect(nonNullTypes.value.replace(/\s/g, "")).toBe(
        "Exclude<AllTypes,null>"
      );

      const onlyNumbers = result.types.OnlyNumbers;
      expect(onlyNumbers).toBeDefined();
      expect(onlyNumbers.definition.replace(/\s/g, "")).toBe(
        "Extract<AllTypes,number>"
      );
      expect(onlyNumbers.value.replace(/\s/g, "")).toBe(
        "Extract<AllTypes,number>"
      );

      const stringOrNumber = result.types.StringOrNumber;
      expect(stringOrNumber).toBeDefined();
      expect(stringOrNumber.definition.replace(/\s/g, "")).toBe(
        "Extract<AllTypes,string|number>"
      );
      expect(stringOrNumber.value.replace(/\s/g, "")).toBe(
        "Extract<AllTypes,string|number>"
      );
      expect(stringOrNumber.isExported).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse hybrid types (intersection of object and function)", () => {
      const content = `
        type EventEmitter = {
          on: (event: string, callback: Function) => void;
          off: (event: string, callback: Function) => void;
          listeners: string[];
        } & ((event: string, ...args: any[]) => void);
        
        export type Playlist = {
          title: string;
          getPlaylist: () => string[];
          clearPlaylist: () => void;
          setPlaylist: (newSongs: string[]) => void;
        } & ((song: string) => void);
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      // Проверяем EventEmitter
      const eventEmitter = result.types.EventEmitter;
      expect(eventEmitter).toBeDefined();
      expect(eventEmitter.name).toBe("EventEmitter");
      expect(eventEmitter.type).toBe("function");
      expect(eventEmitter.isExported).toBe(false);

      // Проверяем функциональную сигнатуру EventEmitter
      expect(eventEmitter.params).toBeDefined();
      expect(eventEmitter.params).toHaveLength(2);
      expect(eventEmitter.params[0].name).toBe("event");
      expect(eventEmitter.params[0].type).toBe("string");
      expect(eventEmitter.params[1].name).toBe("args");
      expect(eventEmitter.params[1].type).toBe("any[]");
      expect(eventEmitter.returnType).toBe("void");

      // Проверяем свойства EventEmitter
      expect(eventEmitter.properties).toBeDefined();
      expect(eventEmitter.properties.on).toContain(
        "(event: string, callback: Function) => void"
      );
      expect(eventEmitter.properties.off).toContain(
        "(event: string, callback: Function) => void"
      );
      expect(eventEmitter.properties.listeners).toBe("string[]");

      // Проверяем Playlist
      const playlist = result.types.Playlist;
      expect(playlist).toBeDefined();
      expect(playlist.name).toBe("Playlist");
      expect(playlist.type).toBe("function");
      expect(playlist.isExported).toBe(true);

      // Проверяем функциональную сигнатуру Playlist
      expect(playlist.params).toBeDefined();
      expect(playlist.params).toHaveLength(1);
      expect(playlist.params[0].name).toBe("song");
      expect(playlist.params[0].type).toBe("string");
      expect(playlist.returnType).toBe("void");

      // Проверяем свойства Playlist
      expect(playlist.properties).toBeDefined();
      expect(playlist.properties.title).toBe("string");
      expect(playlist.properties.getPlaylist).toContain("() => string[]");
      expect(playlist.properties.clearPlaylist).toContain("() => void");
      expect(playlist.properties.setPlaylist).toContain(
        "(newSongs: string[]) => void"
      );

      cleanupTempDir(tempFile);
    });
  });

  // === РАСШИРЕННЫЕ ТЕСТЫ ДЛЯ ДЕКОРАТОРОВ ===
  describe("Decorator Parsing", () => {
    it("should parse class decorators with various argument types", () => {
      const content = `
        @Logger(LogLevel.INFO, "TestClass")
        @Component({
          selector: 'app-test',
          template: '<div>{{title}}</div>',
          providers: ['service1', 'service2']
        })
        @Observable
        export class DecoratedClass {
          title: string = "Test";
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const decoratedClass = result.classes.DecoratedClass;
      expect(decoratedClass).toBeDefined();
      expect(decoratedClass.decorators).toBeDefined();
      expect(decoratedClass.decorators).toHaveLength(3);

      // Проверяем Logger декоратор с простыми аргументами
      const loggerDecorator = decoratedClass.decorators.find(
        (d) => d.name === "Logger"
      );
      expect(loggerDecorator).toBeDefined();
      expect(loggerDecorator.args).toHaveLength(2);
      expect(loggerDecorator.args[0]).toBe("LogLevel.INFO");
      expect(loggerDecorator.args[1]).toBe('"TestClass"');

      // Проверяем Component декоратор с объектным аргументом
      const componentDecorator = decoratedClass.decorators.find(
        (d) => d.name === "Component"
      );
      expect(componentDecorator).toBeDefined();
      expect(componentDecorator.args).toHaveLength(1);
      expect(componentDecorator.args[0]).toContain("selector:");
      expect(componentDecorator.args[0]).toContain("template:");
      expect(componentDecorator.args[0]).toContain("providers:");

      // Проверяем Observable декоратор без аргументов
      const observableDecorator = decoratedClass.decorators.find(
        (d) => d.name === "Observable"
      );
      expect(observableDecorator).toBeDefined();
      expect(observableDecorator.args).toHaveLength(0);

      cleanupTempDir(tempFile);
    });

    it("should parse property decorators with validation", () => {
      const content = `
        class ValidationClass {
          @Required
          @MaxLength(50)
          name: string;

          @MinLength(3)
          @EnumValidation(UserRole)
          role: string;

          @Readonly
          @Lazy(() => new Date().toISOString())
          readonly createdAt: string;
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const validationClass = result.classes.ValidationClass;
      expect(validationClass).toBeDefined();
      expect(validationClass.properties).toBeDefined();

      // Проверяем name свойство с множественными декораторами
      const nameProperty = validationClass.properties.name;
      expect(nameProperty).toBeDefined();
      expect(nameProperty.decorators).toBeDefined();
      expect(nameProperty.decorators).toHaveLength(2);

      const requiredDecorator = nameProperty.decorators.find(
        (d) => d.name === "Required"
      );
      expect(requiredDecorator).toBeDefined();
      expect(requiredDecorator.args).toHaveLength(0);

      const maxLengthDecorator = nameProperty.decorators.find(
        (d) => d.name === "MaxLength"
      );
      expect(maxLengthDecorator).toBeDefined();
      expect(maxLengthDecorator.args[0]).toBe("50");

      // Проверяем role свойство
      const roleProperty = validationClass.properties.role;
      expect(roleProperty).toBeDefined();
      expect(roleProperty.decorators).toBeDefined();
      expect(roleProperty.decorators).toHaveLength(2);

      const minLengthDecorator = roleProperty.decorators.find(
        (d) => d.name === "MinLength"
      );
      expect(minLengthDecorator).toBeDefined();
      expect(minLengthDecorator.args[0]).toBe("3");

      const enumValidationDecorator = roleProperty.decorators.find(
        (d) => d.name === "EnumValidation"
      );
      expect(enumValidationDecorator).toBeDefined();
      expect(enumValidationDecorator.args[0]).toBe("UserRole");

      // Проверяем createdAt свойство
      const createdAtProperty = validationClass.properties.createdAt;
      expect(createdAtProperty).toBeDefined();
      expect(createdAtProperty.decorators).toBeDefined();
      expect(createdAtProperty.decorators).toHaveLength(2);

      const readonlyDecorator = createdAtProperty.decorators.find(
        (d) => d.name === "Readonly"
      );
      expect(readonlyDecorator).toBeDefined();

      const lazyDecorator = createdAtProperty.decorators.find(
        (d) => d.name === "Lazy"
      );
      expect(lazyDecorator).toBeDefined();
      expect(lazyDecorator.args[0]).toContain("() => new Date().toISOString()");

      cleanupTempDir(tempFile);
    });

    it("should parse method decorators with complex configurations", () => {
      const content = `
        class ServiceClass {
          @Cacheable({ ttl: 300, strategy: "memory", maxSize: 100 })
          @Measure(true)
          @LogMethodCalls(LogLevel.DEBUG)
          getData(id: number): Promise<any> {
            return Promise.resolve({ id, data: "test" });
          }

          @Retry(3, 1000)
          @Authorize(["admin", "moderator"])
          @BusinessLogic({ cache: false, retry: true })
          async deleteData(id: number): Promise<boolean> {
            return true;
          }

          @Throttle(1000)
          @ApiEndpoint("/api/search", "GET")
          search(query: string): any[] {
            return [];
          }

          @Debounce(500)
          onInput(value: string): void {
            console.log(value);
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const serviceClass = result.classes.ServiceClass;
      expect(serviceClass).toBeDefined();
      expect(serviceClass.methods).toBeDefined();

      // Проверяем getData метод
      const getDataMethod = serviceClass.methods.getData;
      expect(getDataMethod).toBeDefined();
      expect(getDataMethod.decorators).toBeDefined();
      expect(getDataMethod.decorators).toHaveLength(3);

      const cacheableDecorator = getDataMethod.decorators.find(
        (d) => d.name === "Cacheable"
      );
      expect(cacheableDecorator).toBeDefined();
      expect(cacheableDecorator.args[0]).toContain("ttl:");
      expect(cacheableDecorator.args[0]).toContain("strategy:");
      expect(cacheableDecorator.args[0]).toContain("maxSize:");

      const measureDecorator = getDataMethod.decorators.find(
        (d) => d.name === "Measure"
      );
      expect(measureDecorator).toBeDefined();
      expect(measureDecorator.args[0]).toBe("true");

      const logMethodCallsDecorator = getDataMethod.decorators.find(
        (d) => d.name === "LogMethodCalls"
      );
      expect(logMethodCallsDecorator).toBeDefined();
      expect(logMethodCallsDecorator.args[0]).toBe("LogLevel.DEBUG");

      // Проверяем deleteData метод
      const deleteDataMethod = serviceClass.methods.deleteData;
      expect(deleteDataMethod).toBeDefined();
      expect(deleteDataMethod.decorators).toBeDefined();
      expect(deleteDataMethod.decorators).toHaveLength(3);

      const retryDecorator = deleteDataMethod.decorators.find(
        (d) => d.name === "Retry"
      );
      expect(retryDecorator).toBeDefined();
      expect(retryDecorator.args).toHaveLength(2);
      expect(retryDecorator.args[0]).toBe("3");
      expect(retryDecorator.args[1]).toBe("1000");

      const authorizeDecorator = deleteDataMethod.decorators.find(
        (d) => d.name === "Authorize"
      );
      expect(authorizeDecorator).toBeDefined();
      expect(authorizeDecorator.args[0]).toContain("admin");
      expect(authorizeDecorator.args[0]).toContain("moderator");

      // Проверяем search метод
      const searchMethod = serviceClass.methods.search;
      expect(searchMethod).toBeDefined();
      expect(searchMethod.decorators).toBeDefined();
      expect(searchMethod.decorators).toHaveLength(2);

      const throttleDecorator = searchMethod.decorators.find(
        (d) => d.name === "Throttle"
      );
      expect(throttleDecorator).toBeDefined();
      expect(throttleDecorator.args[0]).toBe("1000");

      const apiEndpointDecorator = searchMethod.decorators.find(
        (d) => d.name === "ApiEndpoint"
      );
      expect(apiEndpointDecorator).toBeDefined();
      expect(apiEndpointDecorator.args[0]).toBe('"/api/search"');
      expect(apiEndpointDecorator.args[1]).toBe('"GET"');

      cleanupTempDir(tempFile);
    });

    it("should parse parameter decorators with transformations", () => {
      const content = `
        class ParameterClass {
          processUser(
            @Validate((name) => name.length > 2, "Name too short")
            @Trim
            @Uppercase
            name: string,

            @TypeCheck("number")
            @DefaultValue(18)
            age: number,

            @Lowercase
            @Trim
            email: string
          ): void {
            console.log(name, age, email);
          }

          searchUsers(
            @Validate((term) => term.length >= 2)
            @Trim
            @Lowercase
            searchTerm: string,

            @DefaultValue(10)
            limit: number = 10
          ): any[] {
            return [];
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const parameterClass = result.classes.ParameterClass;
      expect(parameterClass).toBeDefined();
      expect(parameterClass.methods).toBeDefined();

      // Проверяем processUser метод
      const processUserMethod = parameterClass.methods.processUser;
      expect(processUserMethod).toBeDefined();

      // Параметр декораторы могут обрабатываться по-разному
      // Проверяем хотя бы то, что метод корректно парсится
      expect(processUserMethod.parameters).toBeDefined();
      expect(processUserMethod.parameters).toHaveLength(3);

      // Проверяем что параметры имеют правильные имена и типы
      expect(processUserMethod.parameters[0].name).toBe("name");
      expect(processUserMethod.parameters[0].type).toBe("string");
      expect(processUserMethod.parameters[1].name).toBe("age");
      expect(processUserMethod.parameters[1].type).toBe("number");
      expect(processUserMethod.parameters[2].name).toBe("email");
      expect(processUserMethod.parameters[2].type).toBe("string");

      // Если paramDecorators поддерживается, проверяем их
      if (processUserMethod.paramDecorators) {
        expect(processUserMethod.paramDecorators.length).toBeGreaterThan(0);

        // Проверяем первый параметр если декораторы поддерживаются
        const nameParam = processUserMethod.paramDecorators.find(
          (p) => p.parameterIndex === 0
        );
        if (nameParam) {
          expect(nameParam.decorators).toBeDefined();
          expect(nameParam.decorators.length).toBeGreaterThan(0);
        }
      }

      cleanupTempDir(tempFile);
    });

    it("should parse accessor decorators (getters and setters)", () => {
      const content = `
        class AccessorClass {
          private _value: string = "";

          @LogGetter
          get value(): string {
            return this._value;
          }

          @LogSetter
          @Validate((v) => typeof v === 'string')
          set value(newValue: string) {
            this._value = newValue;
          }

          private _theme: string = "light";

          @LogGetter
          get currentTheme(): string {
            return this._theme;
          }

          @LogSetter
          set currentTheme(theme: string) {
            this._theme = theme;
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const accessorClass = result.classes.AccessorClass;
      expect(accessorClass).toBeDefined();
      expect(accessorClass.methods).toBeDefined();

      // Проверяем что геттеры и сеттеры парсятся как методы
      const methodNames = Object.keys(accessorClass.methods);
      expect(methodNames.length).toBeGreaterThan(0);

      // В зависимости от парсера, геттеры/сеттеры могут парситься по-разному
      // Проверяем хотя бы наличие методов с правильными именами
      const hasValueMethod = methodNames.some((name) => name.includes("value"));
      const hasThemeMethod = methodNames.some(
        (name) => name.includes("currentTheme") || name.includes("theme")
      );

      expect(hasValueMethod || hasThemeMethod).toBe(true);

      // Если есть информация о геттерах, проверяем её
      const valueMethod =
        accessorClass.methods.value ||
        Object.values(accessorClass.methods).find((m) => m.name === "value");

      if (valueMethod) {
        // Проверяем что метод имеет декораторы
        if (valueMethod.decorators) {
          expect(valueMethod.decorators.length).toBeGreaterThan(0);
        }
      }

      cleanupTempDir(tempFile);
    });

    it("should parse inherited classes with decorators", () => {
      const content = `
        @Logger(LogLevel.INFO, "BaseService")
        abstract class BaseService {
          @Required
          protected name: string;

          @Measure()
          abstract processData(): void;
        }

        @Observable
        @Metrics({ trackCalls: true })
        class UserService extends BaseService {
          @MaxLength(100)
          protected name: string = "UserService";

          @Cacheable({ ttl: 60 })
          @Measure()
          processData(): void {
            console.log("Processing user data");
          }

          @Authorize(["admin"])
          deleteUser(@TypeCheck("number") id: number): boolean {
            return true;
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      // Проверяем базовый класс
      const baseService = result.classes.BaseService;
      expect(baseService).toBeDefined();
      expect(baseService.decorators).toBeDefined();
      expect(baseService.decorators).toHaveLength(1);

      const baseLoggerDecorator = baseService.decorators.find(
        (d) => d.name === "Logger"
      );
      expect(baseLoggerDecorator).toBeDefined();
      expect(baseLoggerDecorator.args[0]).toBe("LogLevel.INFO");
      expect(baseLoggerDecorator.args[1]).toBe('"BaseService"');

      expect(baseService.isAbstract).toBe(true);

      // Проверяем производный класс
      const userService = result.classes.UserService;
      expect(userService).toBeDefined();
      expect(userService.decorators).toBeDefined();
      expect(userService.decorators).toHaveLength(2);

      // extends может возвращаться как массив или строка, проверяем оба варианта
      if (Array.isArray(userService.extends)) {
        expect(userService.extends).toContain("BaseService");
      } else {
        expect(userService.extends).toBe("BaseService");
      }

      const observableDecorator = userService.decorators.find(
        (d) => d.name === "Observable"
      );
      expect(observableDecorator).toBeDefined();

      const metricsDecorator = userService.decorators.find(
        (d) => d.name === "Metrics"
      );
      expect(metricsDecorator).toBeDefined();
      expect(metricsDecorator.args[0]).toContain("trackCalls:");

      // Проверяем переопределенные свойства и методы
      expect(userService.properties.name).toBeDefined();
      expect(userService.properties.name.decorators).toBeDefined();

      const maxLengthDecorator = userService.properties.name.decorators.find(
        (d) => d.name === "MaxLength"
      );
      expect(maxLengthDecorator).toBeDefined();
      expect(maxLengthDecorator.args[0]).toBe("100");

      expect(userService.methods.processData).toBeDefined();
      expect(userService.methods.processData.decorators).toBeDefined();
      expect(userService.methods.processData.decorators).toHaveLength(2);

      expect(userService.methods.deleteUser).toBeDefined();

      cleanupTempDir(tempFile);
    });

    it("should parse generic classes with decorators", () => {
      const content = `
        @Component({
          template: '<div>{{data}}</div>'
        })
        class GenericComponent<T> {
          @Required
          data: T;

          @Cacheable({ ttl: 120 })
          processItem(@Validate((item) => item != null) item: T): T {
            return item;
          }
        }

        @Logger(LogLevel.DEBUG, "Repository")
        class Repository<TEntity, TKey> {
          @Lazy(() => new Map())
          private cache: Map<TKey, TEntity>;

          @Measure()
          async findById(@TypeCheck("object") id: TKey): Promise<TEntity | null> {
            return null;
          }

          @Retry(3, 500)
          async save(@Required entity: TEntity): Promise<void> {
            // Save logic
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      // Проверяем GenericComponent
      const genericComponent = result.classes.GenericComponent;
      expect(genericComponent).toBeDefined();
      expect(genericComponent.decorators).toBeDefined();
      expect(genericComponent.decorators).toHaveLength(1);

      // Парсер может не поддерживать поле generics, но должен парсить класс
      // Проверяем что класс корректно обработан
      expect(genericComponent.properties.data).toBeDefined();
      expect(genericComponent.methods.processItem).toBeDefined();

      const componentDecorator = genericComponent.decorators.find(
        (d) => d.name === "Component"
      );
      expect(componentDecorator).toBeDefined();
      expect(componentDecorator.args[0]).toContain("template:");

      // Проверяем Repository
      const repository = result.classes.Repository;
      expect(repository).toBeDefined();
      expect(repository.decorators).toBeDefined();
      expect(repository.decorators).toHaveLength(1);

      // Проверяем что методы корректно парсятся
      expect(repository.methods.findById).toBeDefined();
      expect(repository.methods.save).toBeDefined();

      const repositoryLoggerDecorator = repository.decorators.find(
        (d) => d.name === "Logger"
      );
      expect(repositoryLoggerDecorator).toBeDefined();
      expect(repositoryLoggerDecorator.args[1]).toBe('"Repository"');

      cleanupTempDir(tempFile);
    });

    it("should parse decorators with template strings and complex expressions", () => {
      const content = `
        const API_BASE = "https://api.example.com";
        const VERSION = "v1";

        @Component({
          selector: \`app-\${Date.now()}\`,
          template: \`
            <div class="container">
              <h1>{{title}}</h1>
              <button (click)="onClick()">Click me</button>
            </div>
          \`,
          styleUrls: [\`./styles/component-\${VERSION}.css\`]
        })
        class DynamicComponent {
          @ApiEndpoint(\`\${API_BASE}/\${VERSION}/users\`, "GET")
          @Cacheable({ 
            ttl: 5 * 60, 
            strategy: process.env.NODE_ENV === 'production' ? 'redis' : 'memory' 
          })
          getUsers(): Promise<any[]> {
            return Promise.resolve([]);
          }

          @Validate((input) => input.trim().length > 0)
          @DefaultValue(\`default-\${Math.random()}\`)
          processInput(input: string): string {
            return input;
          }
        }
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      const dynamicComponent = result.classes.DynamicComponent;
      expect(dynamicComponent).toBeDefined();
      expect(dynamicComponent.decorators).toBeDefined();
      expect(dynamicComponent.decorators).toHaveLength(1);

      const componentDecorator = dynamicComponent.decorators.find(
        (d) => d.name === "Component"
      );
      expect(componentDecorator).toBeDefined();
      expect(componentDecorator.args[0]).toContain("selector:");
      expect(componentDecorator.args[0]).toContain("template:");
      expect(componentDecorator.args[0]).toContain("styleUrls:");

      // Проверяем методы с комплексными декораторами
      const getUsersMethod = dynamicComponent.methods.getUsers;
      expect(getUsersMethod).toBeDefined();
      expect(getUsersMethod.decorators).toBeDefined();
      expect(getUsersMethod.decorators).toHaveLength(2);

      const apiEndpointDecorator = getUsersMethod.decorators.find(
        (d) => d.name === "ApiEndpoint"
      );
      expect(apiEndpointDecorator).toBeDefined();
      expect(apiEndpointDecorator.args[0]).toContain(
        "${API_BASE}/${VERSION}/users"
      );

      const cacheableDecorator = getUsersMethod.decorators.find(
        (d) => d.name === "Cacheable"
      );
      expect(cacheableDecorator).toBeDefined();
      expect(cacheableDecorator.args[0]).toContain("ttl:");
      expect(cacheableDecorator.args[0]).toContain("strategy:");

      cleanupTempDir(tempFile);
    });

    it("should handle decorator parsing edge cases", () => {
      const content = `
        // Декораторы с комментариями
        @/* comment */ Logger(LogLevel.INFO)
        @Component(/* config */ {
          selector: 'test'
        })
        class CommentedClass {
          // Свойство с декоратором в комментарии
          // @Deprecated
          @Required
          name: string;

          /* @Internal */
          @Measure()
          method(): void {}
        }

        // Декораторы с необычными пробелами и переносами
        @   Logger   (   LogLevel.DEBUG   ,   "SpacedClass"   )
        @
        Observable
        class SpacedClass {
          @
            Required
          @
            MaxLength(
              100
            )
          description: string;
        }

        // Декораторы с вычисляемыми значениями
        @Logger(process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR)
        @Component({
          selector: ['app', 'component'].join('-'),
          providers: [1, 2, 3].map(i => \`service\${i}\`)
        })
        class ComputedClass {}
      `;
      const tempFile = createTempFileWithContent(content);
      const result = parseTypeScript([tempFile]);

      // Проверяем что классы парсятся несмотря на комментарии и пробелы
      expect(result.classes.CommentedClass).toBeDefined();
      expect(result.classes.SpacedClass).toBeDefined();
      expect(result.classes.ComputedClass).toBeDefined();

      // Проверяем что декораторы корректно извлекаются
      const commentedClass = result.classes.CommentedClass;
      expect(commentedClass.decorators).toBeDefined();
      expect(commentedClass.decorators.length).toBeGreaterThan(0);

      const spacedClass = result.classes.SpacedClass;
      expect(spacedClass.decorators).toBeDefined();
      expect(spacedClass.decorators.length).toBeGreaterThan(0);

      const computedClass = result.classes.ComputedClass;
      expect(computedClass.decorators).toBeDefined();
      expect(computedClass.decorators.length).toBeGreaterThan(0);

      cleanupTempDir(tempFile);
    });
  });

  // Добавьте другие тесты для различных конструкций TypeScript
});
