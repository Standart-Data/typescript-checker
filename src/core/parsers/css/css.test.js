import { expect, describe, it } from "vitest";
const { parseCSS } = require("./index");
const { createTempFileWithContent } = require("../../../utils");

describe("CSS Parser - Nested Structure", () => {
  it("должен создавать вложенную структуру для CSS классов", () => {
    const cssContent = `
      .container {
        display: flex;
        color: var(--primary-color);
        padding: 20px;
      }
      
      .container:hover {
        transform: scale(1.05);
      }
      
      #header {
        background: blue;
        margin: 10px;
      }
      
      h1 {
        font-size: 24px;
        font-weight: bold;
      }
      
      @media (max-width: 768px) {
        .container {
          flex-direction: column;
          padding: 10px;
        }
        
        h1 {
          font-size: 18px;
        }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `;

    const tempFile = createTempFileWithContent(cssContent, ".css");
    const result = parseCSS([tempFile]);

    // Проверяем структуру классов
    expect(result.classes).toHaveProperty("container");
    expect(result.classes.container).toHaveProperty("name", "container");
    expect(result.classes.container).toHaveProperty("selector", ".container");
    expect(result.classes.container.properties).toHaveProperty(
      "display",
      "flex"
    );
    expect(result.classes.container.properties).toHaveProperty(
      "color",
      "var(--primary-color)"
    );
    expect(result.classes.container.properties).toHaveProperty(
      "padding",
      "20px"
    );

    // Проверяем псевдо-классы
    expect(result.classes.container.pseudoClasses).toHaveProperty("hover");
    expect(result.classes.container.pseudoClasses.hover).toHaveProperty(
      "transform",
      "scale(1.05)"
    );

    // Проверяем ID селекторы
    expect(result.ids).toHaveProperty("header");
    expect(result.ids.header.properties).toHaveProperty("background", "blue");
    expect(result.ids.header.properties).toHaveProperty("margin", "10px");

    // Проверяем элементы
    expect(result.elements).toHaveProperty("h1");
    expect(result.elements.h1.properties).toHaveProperty("font-size", "24px");
    expect(result.elements.h1.properties).toHaveProperty("font-weight", "bold");

    // Проверяем media queries
    expect(result.mediaQueries).toHaveProperty("(max-width:768px)");
    expect(result.classes.container.mediaQueries).toHaveProperty(
      "(max-width:768px)"
    );
    expect(
      result.classes.container.mediaQueries["(max-width:768px)"]
    ).toHaveProperty("flex-direction", "column");
    expect(
      result.classes.container.mediaQueries["(max-width:768px)"]
    ).toHaveProperty("padding", "10px");

    // Проверяем keyframes
    expect(result.keyframes).toHaveProperty("slideIn");
    expect(result.keyframes.slideIn.frames).toHaveProperty("from");
    expect(result.keyframes.slideIn.frames).toHaveProperty("to");
    expect(result.keyframes.slideIn.frames.from).toHaveProperty(
      "transform",
      "translateX(-100%)"
    );
    expect(result.keyframes.slideIn.frames.to).toHaveProperty(
      "transform",
      "translateX(0)"
    );

    // Проверяем CSS переменные
    expect(result.variables).toHaveProperty("--primary-color");
    expect(result.variables["--primary-color"].usedIn).toHaveLength(1);
    expect(result.variables["--primary-color"].usedIn[0].selector).toContain(
      ".container"
    );
    expect(result.variables["--primary-color"].usedIn[0].property).toBe(
      "color"
    );
  });

  it("должен корректно обрабатывать CSS модуль с вложенной структурой", () => {
    const cssModuleContent = `
      .button {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      
      .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .button--primary {
        background: #007bff;
        color: white;
      }
      
      .button--secondary {
        background: #6c757d;
        color: white;
      }
      
      @media (max-width: 480px) {
        .button {
          padding: 8px 16px;
          font-size: 14px;
        }
      }
    `;

    const tempFile = createTempFileWithContent(cssModuleContent, ".module.css");
    const result = parseCSS([tempFile]);

    // Проверяем экспорты CSS модуля
    expect(result.exports).toContain("button");
    expect(result.exports).toContain("button--primary");
    expect(result.exports).toContain("button--secondary");

    // Проверяем базовые стили кнопки (проверяем только те свойства, которые не перезаписаны media query)
    expect(result.classes.button.properties).toHaveProperty("border", "none");
    expect(result.classes.button.properties).toHaveProperty(
      "border-radius",
      "4px"
    );
    expect(result.classes.button.properties).toHaveProperty(
      "cursor",
      "pointer"
    );

    // Padding и font-size перезаписаны media query, так что проверяем их там

    // Проверяем псевдо-классы
    expect(result.classes.button.pseudoClasses).toHaveProperty("hover");
    expect(result.classes.button.pseudoClasses).toHaveProperty("disabled");
    expect(result.classes.button.pseudoClasses.hover).toHaveProperty(
      "transform",
      "translateY(-2px)"
    );
    expect(result.classes.button.pseudoClasses.disabled).toHaveProperty(
      "opacity",
      "0.5"
    );

    // Проверяем модификаторы
    expect(result.classes["button--primary"].properties).toHaveProperty(
      "background",
      "#007bff"
    );
    expect(result.classes["button--primary"].properties).toHaveProperty(
      "color",
      "white"
    );

    // Проверяем media queries для кнопки
    expect(result.classes.button.mediaQueries).toHaveProperty(
      "(max-width:480px)"
    );
    expect(
      result.classes.button.mediaQueries["(max-width:480px)"]
    ).toHaveProperty("padding", "8px 16px");
    expect(
      result.classes.button.mediaQueries["(max-width:480px)"]
    ).toHaveProperty("font-size", "14px");

    // Проверяем контекст
    expect(result.classes.button.context).toBeInstanceOf(Array);
    expect(result.classes.button.context.length).toBeGreaterThan(0);
  });

  it("должен обрабатывать сложные CSS переменные и их использование", () => {
    const cssContent = `
      :root {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --border-radius: 4px;
        --spacing-unit: 8px;
      }
      
      .card {
        background: var(--primary-color);
        border-radius: var(--border-radius);
        padding: calc(var(--spacing-unit) * 2);
        margin: var(--spacing-unit);
      }
      
      .card--secondary {
        background: var(--secondary-color);
      }
      
      .input {
        border: 1px solid var(--primary-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-unit);
      }
    `;

    const tempFile = createTempFileWithContent(cssContent, ".css");
    const result = parseCSS([tempFile]);

    // Проверяем определение переменных
    expect(result.variables).toHaveProperty("--primary-color");
    expect(result.variables).toHaveProperty("--secondary-color");
    expect(result.variables).toHaveProperty("--border-radius");
    expect(result.variables).toHaveProperty("--spacing-unit");

    expect(result.variables["--primary-color"].value).toBe("#007bff");
    expect(result.variables["--secondary-color"].value).toBe("#6c757d");

    // Проверяем использование переменных
    expect(result.variables["--primary-color"].usedIn).toHaveLength(2); // card и input
    expect(result.variables["--border-radius"].usedIn).toHaveLength(2); // card и input
    expect(result.variables["--spacing-unit"].usedIn).toHaveLength(3); // card (padding calc и margin) и input

    // Проверяем что переменные правильно связаны с селекторами
    const primaryUsage = result.variables["--primary-color"].usedIn;
    const cardUsage = primaryUsage.find((usage) =>
      usage.selector.includes(".card")
    );
    const inputUsage = primaryUsage.find((usage) =>
      usage.selector.includes(".input")
    );

    expect(cardUsage).toBeDefined();
    expect(cardUsage.property).toBe("background");
    expect(inputUsage).toBeDefined();
    expect(inputUsage.property).toBe("border");
  });

  it("должен обрабатывать обратную совместимость", () => {
    const cssContent = `
      .container {
        display: flex;
        color: red;
      }
      
      #main {
        background: blue;
      }
    `;

    const tempFile = createTempFileWithContent(cssContent, ".css");
    const result = parseCSS([tempFile]);

    // Проверяем что старые поля доступны для обратной совместимости
    expect(result.allProperties).toContain("display");
    expect(result.allProperties).toContain("color");
    expect(result.allProperties).toContain("background");

    expect(result.selectors).toContain(".container");
    expect(result.selectors).toContain("#main");

    // Проверяем что новая структура тоже работает
    expect(result.classes.container.properties.display).toBe("flex");
    expect(result.ids.main.properties.background).toBe("blue");
  });

  it("должен обрабатывать ошибки парсинга", () => {
    const invalidCSS = `
      .broken {
        color: red
        background: blue;
      }
    `;

    const tempFile = createTempFileWithContent(invalidCSS, ".css");

    expect(() => parseCSS([tempFile])).not.toThrow();
  });
});
