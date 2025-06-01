const babel = require("@babel/core");
const fs = require("fs");
const tmp = require("tmp");

/**
 * Валидирует JSX/TSX код через Babel
 * @param {string} code - Исходный код
 * @param {object} options - Опции компилятора
 * @returns {Array} - Массив ошибок
 */
function validateBabel(code, options = {}) {
  try {
    const isTypeScript = options.typescript || false;

    const babelOptions = {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
      plugins: [],
      filename: isTypeScript ? "test.tsx" : "test.jsx",
      parserOpts: {
        sourceType: "module",
        allowImportExportEverywhere: true,
        plugins: ["jsx", ...(isTypeScript ? ["typescript"] : [])],
      },
    };

    // Пытаемся распарсить код
    babel.parse(code, babelOptions);

    return []; // Если парсинг прошел успешно, ошибок нет
  } catch (error) {
    const errorInfo = {
      message: error.message,
    };

    if (error.loc) {
      errorInfo.location = {
        line: error.loc.line,
        column: error.loc.column + 1,
      };
    }

    return [errorInfo];
  }
}

/**
 * Компилирует JSX/TSX код через Babel
 * @param {string} code - Исходный код
 * @param {object} options - Опции компилятора
 * @returns {string} - Скомпилированный JavaScript код
 */
function processBabel(code, options = {}) {
  try {
    const isTypeScript = options.typescript || false;

    const babelOptions = {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: false }],
        [
          "@babel/preset-react",
          { runtime: "automatic", importSource: "react" },
        ],
      ],
      plugins: [],
      filename: isTypeScript ? "input.tsx" : "input.jsx",
      parserOpts: {
        sourceType: "module",
        allowImportExportEverywhere: true,
        plugins: ["jsx", ...(isTypeScript ? ["typescript"] : [])],
      },
    };

    // Если это TypeScript, добавляем плагин для удаления типов
    if (isTypeScript) {
      babelOptions.presets.push([
        "@babel/preset-typescript",
        {
          isTSX: true,
          allExtensions: true,
        },
      ]);
    }

    const result = babel.transformSync(code, babelOptions);
    return result.code || "";
  } catch (error) {
    console.error("Error during Babel transformation:", error);
    return "";
  }
}

module.exports = { validateBabel, processBabel };
