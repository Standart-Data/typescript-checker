import { describe, it, expect } from "vitest";
import { parseReact } from "../parseReact";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../../tests/testUtils";

describe("React Parser - Basic Functionality", () => {
  it("should parse React functional component bodies correctly", () => {
    const content = `
      import React from 'react';
      
      export const SimpleComponent: React.FC<{name: string}> = ({name}) => {
        const greeting = \`Hello, \${name}!\`;
        return <div>{greeting}</div>;
      };
      
      export const ArrowComponent: React.FC<{title: string}> = (props) => {
        const [count, setCount] = React.useState(0);
        
        const handleClick = () => {
          setCount(count + 1);
        };
        
        return (
          <div>
            <h1>{props.title}</h1>
            <button onClick={handleClick}>Count: {count}</button>
          </div>
        );
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем стрелочный компонент
    const simpleComponent = result.functions.SimpleComponent;
    expect(simpleComponent).toBeDefined();
    expect(simpleComponent.body).toBeDefined();
    expect(typeof simpleComponent.body).toBe("string");
    expect(simpleComponent.body).toContain(
      "const greeting = `Hello, ${name}!`"
    );
    expect(simpleComponent.body).toContain("return <div>{greeting}</div>");

    // Проверяем другой стрелочный компонент
    const arrowComponent = result.functions.ArrowComponent;
    expect(arrowComponent).toBeDefined();
    expect(arrowComponent.body).toBeDefined();
    expect(typeof arrowComponent.body).toBe("string");
    expect(arrowComponent.body).toContain(
      "const [count, setCount] = React.useState(0)"
    );
    expect(arrowComponent.body).toContain("const handleClick = () =>");
    expect(arrowComponent.body).toContain("setCount(count + 1)");

    cleanupTempDir(tempFile);
  });

  it("should parse React class component method bodies correctly", () => {
    const content = `
      import React from 'react';
      
      export class ClassComponent extends React.Component<{title: string}, {count: number}> {
        constructor(props: {title: string}) {
          super(props);
          this.state = { count: 0 };
        }
        
        public render(): JSX.Element {
          return (
            <div>
              <h1>{this.props.title}</h1>
              <p>Count: {this.state.count}</p>
              <button onClick={this.handleIncrement}>
                Increment
              </button>
            </div>
          );
        }
        
        componentDidMount(): void {
          console.log('Component mounted');
          this.logComponentInfo();
        }
        
        private logComponentInfo(): void {
          console.log(\`Component title: \${this.props.title}\`);
        }
        
        handleIncrement(): void {
          this.setState(prevState => ({
            count: prevState.count + 1
          }));
        }
      }
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    const classComponent = result.classes.ClassComponent;
    expect(classComponent).toBeDefined();

    // Проверяем метод render
    const renderMethod = classComponent.methods.render;
    expect(renderMethod).toBeDefined();
    expect(renderMethod.body).toBeDefined();
    expect(typeof renderMethod.body).toBe("string");
    expect(renderMethod.body).toContain("return (");
    expect(renderMethod.body).toContain("<h1>{this.props.title}</h1>");
    expect(renderMethod.body).toContain("<p>Count: {this.state.count}</p>");

    // Проверяем componentDidMount
    const componentDidMountMethod = classComponent.methods.componentDidMount;
    expect(componentDidMountMethod).toBeDefined();
    expect(componentDidMountMethod.body).toBeDefined();
    expect(typeof componentDidMountMethod.body).toBe("string");
    expect(componentDidMountMethod.body).toContain(
      "console.log('Component mounted')"
    );
    expect(componentDidMountMethod.body).toContain("this.logComponentInfo()");

    // Проверяем приватный метод
    const logComponentInfoMethod = classComponent.methods.logComponentInfo;
    expect(logComponentInfoMethod).toBeDefined();
    expect(logComponentInfoMethod.body).toBeDefined();
    expect(typeof logComponentInfoMethod.body).toBe("string");
    expect(logComponentInfoMethod.body).toContain(
      "console.log(`Component title: ${this.props.title}`)"
    );

    // Проверяем handleIncrement
    const handleIncrementMethod = classComponent.methods.handleIncrement;
    expect(handleIncrementMethod).toBeDefined();
    expect(handleIncrementMethod.body).toBeDefined();
    expect(typeof handleIncrementMethod.body).toBe("string");
    expect(handleIncrementMethod.body).toContain("this.setState(prevState =>");
    expect(handleIncrementMethod.body).toContain("count: prevState.count + 1");

    cleanupTempDir(tempFile);
  });

  it("should handle components without implementation bodies", () => {
    const content = `
      import React from 'react';
      
      // Объявление типов без реализации
      interface ComponentProps {
        title: string;
        onAction(): void;
      }
      
      // Абстрактный класс
      abstract class AbstractComponent extends React.Component<ComponentProps> {
        abstract render(): JSX.Element;
        
        protected abstract handleAction(): void;
      }
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Абстрактные методы не должны иметь body
    if (result.classes && result.classes.AbstractComponent) {
      const abstractComponent = result.classes.AbstractComponent;

      if (abstractComponent.methods && abstractComponent.methods.render) {
        expect(abstractComponent.methods.render.body).toBeUndefined();
      }

      if (abstractComponent.methods && abstractComponent.methods.handleAction) {
        expect(abstractComponent.methods.handleAction.body).toBeUndefined();
      }
    }

    cleanupTempDir(tempFile);
  });

  it("should parse regular JavaScript functions in React files", () => {
    const content = `
      import React from 'react';
      
      export const MyComponent: React.FC = () => {
        const result = "processed data";
        const sum = 5 + 3;
        
        return <div>{result} - Sum: {sum}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем что основной компонент имеет body
    const myComponent = result.functions.MyComponent;
    expect(myComponent).toBeDefined();
    expect(myComponent.body).toBeDefined();
    expect(typeof myComponent.body).toBe("string");
    expect(myComponent.body).toContain('const result = "processed data"');
    expect(myComponent.body).toContain("const sum = 5 + 3");
    expect(myComponent.body).toContain(
      "return <div>{result} - Sum: {sum}</div>"
    );

    cleanupTempDir(tempFile);
  });

  it("should preserve component parameter types correctly", () => {
    const content = `
      import React from 'react';
      
      interface Props {
        name: string;
        age?: number;
        isActive: boolean;
      }
      
      export const TypedComponent: React.FC<Props> = ({name, age = 25, isActive}) => {
        const status = isActive ? 'active' : 'inactive';
        return (
          <div>
            <h2>{name}</h2>
            <p>Age: {age}</p>
            <p>Status: {status}</p>
          </div>
        );
      };
      
      export const AnotherComponent: React.FC<{title: string; count: number}> = (props) => {
        return <h1>{props.title}: {props.count}</h1>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем типизированный компонент (деструктурированные параметры)
    const typedComponent = result.functions.TypedComponent;
    expect(typedComponent).toBeDefined();
    expect(typedComponent.params).toBeDefined();
    expect(typedComponent.params).toHaveLength(3);
    expect(typedComponent.params[0].name).toBe("name");
    expect(typedComponent.params[1].name).toBe("age");
    expect(typedComponent.params[2].name).toBe("isActive");

    // Проверяем другой компонент (обычные параметры)
    const anotherComponent = result.functions.AnotherComponent;
    expect(anotherComponent).toBeDefined();
    expect(anotherComponent.params).toBeDefined();
    expect(anotherComponent.params).toHaveLength(1);
    expect(anotherComponent.params[0].name).toBe("props");

    cleanupTempDir(tempFile);
  });

  it("should handle mixed exports correctly", () => {
    const content = `
      import React from 'react';
      
      const utils = {
        format: (text: string) => text.toUpperCase()
      };
      
      export const MyComponent: React.FC = () => <div>Hello</div>;
      export { utils };
      export default MyComponent;
    `;
    const tempFile = createTempFileWithContent(content);
    const result = parseReact([tempFile]);

    expect(result.exports.MyComponent).toBe(true);
    expect(result.exports.utils).toBe(true);
    expect(result.exports.default).toBe("MyComponent");

    cleanupTempDir(tempFile);
  });

  it("should parse object literals with structured values in React files", () => {
    const content = `
      import React from 'react';
      
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
      
      export const MyComponent: React.FC = () => {
        return <div>{courses.JavaScript.author}</div>;
      };
    `;
    const tempFile = createTempFileWithContent(content, ".tsx");
    const result = parseReact([tempFile]);

    // Проверяем что объект парсится структурированно
    const coursesVar = result.variables.courses;
    expect(coursesVar).toBeDefined();
    expect(coursesVar.types).toContain("Record<Course, CourseInfo>");
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
    expect(result.variables.simpleString.value).toBe('"hello world"');
    expect(result.variables.numberVar.value).toBe("42");
    expect(result.variables.boolVar.value).toBe("true");

    // Проверяем что React компонент тоже распознается
    expect(result.functions.MyComponent).toBeDefined();
    expect(result.functions.MyComponent.jsx).toBe(true);

    cleanupTempDir(tempFile);
  });
});
