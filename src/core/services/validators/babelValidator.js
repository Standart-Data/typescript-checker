const babel = require("@babel/core");
const path = require("path");
const { getFileExtension } = require("../utils/fileExtensions");

/**
 * Создает конфигурацию Babel для валидации
 * @param {string} filename - имя файла
 * @param {Object} tempProject - временный проект
 * @returns {Object} конфигурация Babel
 */
function createBabelValidationConfig(filename, tempProject) {
  const extension = getFileExtension(filename);
  const isTypeScript = extension === "tsx" || extension === "ts";
  const isJSX = extension === "tsx" || extension === "jsx";

  const babelOptions = {
    presets: [
      ["@babel/preset-env", { targets: { node: "current" } }],
      ...(isJSX ? [["@babel/preset-react", { runtime: "automatic" }]] : []),
    ],
    plugins: [["@babel/plugin-proposal-decorators", { legacy: true }]],
    filename: path.join(tempProject.tempDir.name, filename),
    parserOpts: {
      sourceType: "module",
      allowImportExportEverywhere: true,
      plugins: [
        ...(isJSX ? ["jsx"] : []),
        ...(isTypeScript ? ["typescript"] : []),
      ],
    },
  };

  if (isTypeScript) {
    babelOptions.presets.push([
      "@babel/preset-typescript",
      {
        isTSX: isJSX,
        allExtensions: true,
      },
    ]);
  }

  return babelOptions;
}

/**
 * Создает конфигурацию Babel для компиляции
 * @param {string} filename - имя файла
 * @param {Object} tempProject - временный проект
 * @returns {Object} конфигурация Babel
 */
function createBabelCompilationConfig(filename, tempProject) {
  const extension = getFileExtension(filename);
  const isTypeScript = extension === "tsx" || extension === "ts";
  const isJSX = extension === "tsx" || extension === "jsx";

  const babelOptions = {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "current" },
          modules: false,
        },
      ],
      ...(isJSX
        ? [
            [
              "@babel/preset-react",
              {
                runtime: "automatic",
                importSource: "react",
              },
            ],
          ]
        : []),
    ],
    plugins: [["@babel/plugin-proposal-decorators", { legacy: true }]],
    filename: path.join(tempProject.tempDir.name, filename),
    parserOpts: {
      sourceType: "module",
      allowImportExportEverywhere: true,
      plugins: [
        ...(isJSX ? ["jsx"] : []),
        ...(isTypeScript ? ["typescript"] : []),
      ],
    },
  };

  if (isTypeScript) {
    babelOptions.presets.push([
      "@babel/preset-typescript",
      {
        isTSX: isJSX,
        allExtensions: true,
      },
    ]);
  }

  return babelOptions;
}

/**
 * Валидирует Babel файл (jsx/tsx/ts) в контексте проекта
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @returns {Array} массив ошибок
 */
function validateBabelInProject(filename, content, tempProject) {
  try {
    const babelOptions = createBabelValidationConfig(filename, tempProject);

    // Пытаемся распарсить код
    babel.parse(content, babelOptions);

    return [];
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
 * Компилирует файл с помощью Babel
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @returns {string} скомпилированный код
 */
function compileBabelFile(filename, content, tempProject) {
  const babelOptions = createBabelCompilationConfig(filename, tempProject);
  const result = babel.transformSync(content, babelOptions);
  return result.code || "";
}

module.exports = {
  validateBabelInProject,
  compileBabelFile,
  createBabelValidationConfig,
  createBabelCompilationConfig,
};
