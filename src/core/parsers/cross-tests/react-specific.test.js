import { describe, it, expect } from "vitest";
import { parseTypeScript } from "../typescript";
import { parseReact } from "../react";
import {
  createTempFileWithContent,
  cleanupTempDir,
} from "../../tests/testUtils";

describe("Cross-Parser React-Specific Consistency", () => {
  const testCases = [
    // === REACT-СПЕЦИФИЧНЫЕ ТЕСТЫ ===
    {
      name: "React Functional Component",
      tsContent: `
        import React from 'react';
        export const MyComponent: React.FC<{name: string}> = ({name}) => {
          return <div>Hello {name}</div>;
        };
      `,
      reactContent: `
        import React from 'react';
        export const MyComponent: React.FC<{name: string}> = ({name}) => {
          return <div>Hello {name}</div>;
        };
      `,
      check: (tsResult, reactResult) => {
        // TypeScript парсер видит это как переменную
        expect(tsResult.variables.MyComponent).toBeDefined();
        expect(tsResult.variables.MyComponent.isExported).toBe(true);

        // React парсер должен распознать это как компонент
        expect(reactResult.exports.MyComponent).toBe(true);
      },
    },
    {
      name: "React Class Component",
      tsContent: `
        import React, { Component } from 'react';
        export class MyClassComponent extends Component<{title: string}> {
          render() {
            return <h1>{this.props.title}</h1>;
          }
        }
      `,
      reactContent: `
        import React, { Component } from 'react';
        export class MyClassComponent extends Component<{title: string}> {
          render() {
            return <h1>{this.props.title}</h1>;
          }
        }
      `,
      check: (tsResult, reactResult) => {
        // Оба парсера должны видеть это как класс
        expect(tsResult.classes.MyClassComponent).toBeDefined();
        expect(tsResult.classes.MyClassComponent.isExported).toBe(true);

        expect(reactResult.exports.MyClassComponent).toBe(true);
        // React парсер может дополнительно обрабатывать как компонент
      },
    },
    {
      name: "React Component Body Consistency",
      tsContent: `
        import React from 'react';
        export const Counter: React.FC<{initialValue: number}> = ({initialValue}) => {
          const [count, setCount] = React.useState(initialValue);
          
          const increment = () => {
            setCount(prev => prev + 1);
          };
          
          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={increment}>Increment</button>
            </div>
          );
        };
      `,
      reactContent: `
        import React from 'react';
        export const Counter: React.FC<{initialValue: number}> = ({initialValue}) => {
          const [count, setCount] = React.useState(initialValue);
          
          const increment = () => {
            setCount(prev => prev + 1);
          };
          
          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={increment}>Increment</button>
            </div>
          );
        };
      `,
      check: (tsResult, reactResult) => {
        // TypeScript видит это как переменную
        expect(tsResult.variables.Counter).toBeDefined();
        expect(tsResult.variables.Counter.isExported).toBe(true);

        // React парсер должен обработать как компонент с body
        expect(reactResult.exports.Counter).toBe(true);
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
          JSON.stringify(tsResult, null, 2)
        );
        console.log(
          `React Result for ${tc.name}:`,
          JSON.stringify(reactResult, null, 2)
        );
        throw error;
      }

      cleanupTempDir(tsFile);
      cleanupTempDir(reactFile);
    });
  });
});
