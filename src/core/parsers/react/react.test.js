import { describe, it, expect, afterEach } from "vitest";
import { parseReact } from "./parseReact";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("parseReact", () => {
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

  describe("Utility Types in React", () => {
    it("should parse Pick utility type in React files", () => {
      const content = `
        import React from 'react';
        
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
        
        const MyComponent: React.FC<{film: FilmPreview}> = ({film}) => {
          return <div>{film.name}</div>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const filmPreview = result.types.FilmPreview;
      expect(filmPreview).toBeDefined();
      expect(filmPreview.name).toBe("FilmPreview");
      expect(filmPreview.type).toBe(
        'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
      );
      expect(filmPreview.value).toBe(
        'Pick<Film, "id" | "description" | "genres" | "logo" | "name">'
      );
      expect(filmPreview.isExported).toBe(false);

      const publicFilmInfo = result.types.PublicFilmInfo;
      expect(publicFilmInfo).toBeDefined();
      expect(publicFilmInfo.name).toBe("PublicFilmInfo");
      expect(publicFilmInfo.type).toBe(
        'Pick<Film, "name" | "year" | "rating">'
      );
      expect(publicFilmInfo.value).toBe(
        'Pick<Film, "name" | "year" | "rating">'
      );
      expect(publicFilmInfo.isExported).toBe(true);

      // Проверяем что React компонент тоже парсится
      expect(result.functions.MyComponent).toBeDefined();
      expect(result.functions.MyComponent.jsx).toBe(true);

      cleanupTempDir(tempFile);
    });

    it("should parse Omit utility type in React files", () => {
      const content = `
        import React from 'react';
        
        interface User {
          id: string;
          name: string;
          email: string;
          password: string;
          createdAt: Date;
        }
        
        type UserWithoutPassword = Omit<User, "password">;
        export type PublicUser = Omit<User, "password" | "email">;
        
        const UserProfile: React.FC<{user: PublicUser}> = ({user}) => {
          return <div>{user.name}</div>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const userWithoutPassword = result.types.UserWithoutPassword;
      expect(userWithoutPassword).toBeDefined();
      expect(userWithoutPassword.type).toBe('Omit<User, "password">');
      expect(userWithoutPassword.value).toBe('Omit<User, "password">');
      expect(userWithoutPassword.isExported).toBe(false);

      const publicUser = result.types.PublicUser;
      expect(publicUser).toBeDefined();
      expect(publicUser.type).toBe('Omit<User, "password" | "email">');
      expect(publicUser.value).toBe('Omit<User, "password" | "email">');
      expect(publicUser.isExported).toBe(true);

      expect(result.functions.UserProfile).toBeDefined();

      cleanupTempDir(tempFile);
    });

    it("should parse Partial utility type in React files", () => {
      const content = `
        import React from 'react';
        
        interface Config {
          apiUrl: string;
          timeout: number;
          retries: number;
        }
        
        type PartialConfig = Partial<Config>;
        export type OptionalConfig = Partial<Pick<Config, "timeout" | "retries">>;
        
        const ConfigForm: React.FC<{config: PartialConfig}> = ({config}) => {
          return <div>{config.apiUrl}</div>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const partialConfig = result.types.PartialConfig;
      expect(partialConfig).toBeDefined();
      expect(partialConfig.type).toBe("Partial<Config>");
      expect(partialConfig.value).toBe("Partial<Config>");

      const optionalConfig = result.types.OptionalConfig;
      expect(optionalConfig).toBeDefined();
      expect(optionalConfig.type).toBe(
        'Partial<Pick<Config, "timeout" | "retries">>'
      );
      expect(optionalConfig.value).toBe(
        'Partial<Pick<Config, "timeout" | "retries">>'
      );
      expect(optionalConfig.isExported).toBe(true);

      expect(result.functions.ConfigForm).toBeDefined();

      cleanupTempDir(tempFile);
    });

    it("should parse Required utility type in React files", () => {
      const content = `
        import React from 'react';
        
        interface Options {
          name?: string;
          age?: number;
          active?: boolean;
        }
        
        type RequiredOptions = Required<Options>;
        export type StrictOptions = Required<Pick<Options, "name" | "age">>;
        
        const OptionsDisplay: React.FC<{options: RequiredOptions}> = ({options}) => {
          return <div>{options.name}</div>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const requiredOptions = result.types.RequiredOptions;
      expect(requiredOptions).toBeDefined();
      expect(requiredOptions.type).toBe("Required<Options>");
      expect(requiredOptions.value).toBe("Required<Options>");

      const strictOptions = result.types.StrictOptions;
      expect(strictOptions).toBeDefined();
      expect(strictOptions.type).toBe(
        'Required<Pick<Options, "name" | "age">>'
      );
      expect(strictOptions.value).toBe(
        'Required<Pick<Options, "name" | "age">>'
      );
      expect(strictOptions.isExported).toBe(true);

      expect(result.functions.OptionsDisplay).toBeDefined();

      cleanupTempDir(tempFile);
    });

    it("should parse Record utility type in React files", () => {
      const content = `
        import React from 'react';
        
        type Status = "pending" | "approved" | "rejected";
        type StatusInfo = {
          label: string;
          color: string;
        };
        
        type StatusMap = Record<Status, StatusInfo>;
        export type StringRecord = Record<string, number>;
        
        const StatusBadge: React.FC<{status: Status}> = ({status}) => {
          return <span>{status}</span>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const statusMap = result.types.StatusMap;
      expect(statusMap).toBeDefined();
      expect(statusMap.type).toBe("Record<Status, StatusInfo>");
      expect(statusMap.value).toBe("Record<Status, StatusInfo>");

      const stringRecord = result.types.StringRecord;
      expect(stringRecord).toBeDefined();
      expect(stringRecord.type).toBe("Record<string, number>");
      expect(stringRecord.value).toBe("Record<string, number>");
      expect(stringRecord.isExported).toBe(true);

      expect(result.functions.StatusBadge).toBeDefined();

      cleanupTempDir(tempFile);
    });

    it("should parse Exclude and Extract utility types in React files", () => {
      const content = `
        import React from 'react';
        
        type AllTypes = string | number | boolean | null;
        type PrimitiveTypes = "string" | "number" | "boolean";
        
        type NonNullTypes = Exclude<AllTypes, null>;
        type OnlyNumbers = Extract<AllTypes, number>;
        export type StringOrNumber = Extract<AllTypes, string | number>;
        
        const TypeChecker: React.FC<{value: NonNullTypes}> = ({value}) => {
          return <div>{typeof value}</div>;
        };
      `;
      const tempFile = createTempFileWithContent(content, ".tsx");
      const result = parseReact([tempFile]);

      const nonNullTypes = result.types.NonNullTypes;
      expect(nonNullTypes).toBeDefined();
      expect(nonNullTypes.type).toBe("Exclude<AllTypes, null>");
      expect(nonNullTypes.value).toBe("Exclude<AllTypes, null>");

      const onlyNumbers = result.types.OnlyNumbers;
      expect(onlyNumbers).toBeDefined();
      expect(onlyNumbers.type).toBe("Extract<AllTypes, number>");
      expect(onlyNumbers.value).toBe("Extract<AllTypes, number>");

      const stringOrNumber = result.types.StringOrNumber;
      expect(stringOrNumber).toBeDefined();
      expect(stringOrNumber.type).toBe("Extract<AllTypes, string | number>");
      expect(stringOrNumber.value).toBe("Extract<AllTypes, string | number>");
      expect(stringOrNumber.isExported).toBe(true);

      expect(result.functions.TypeChecker).toBeDefined();

      cleanupTempDir(tempFile);
    });
  });
});
