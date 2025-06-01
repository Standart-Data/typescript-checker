const { validateTypeScript, processTypeScript } = require("./typescript");
const { validateBabel, processBabel } = require("./babel");
const { validateCSS, processCSS } = require("./css");

/**
 * Создает "процессор" для указанного типа файла,
 * возвращая объект с функциями validate и process.
 * @param {string} fileExtension - Расширение файла (ts, tsx, jsx, d.ts).
 * @param {string} code - Содержимое файла.
 * @param {Object} options - Дополнительные опции.
 * @returns {{validate: Function, process: Function, errors: Array, result: string}} - Объект с методами и свойствами.
 */
function createProcessor(fileExtension, code, options = {}) {
  let currentErrors = [];
  let currentResult = "";

  const baseOptions = options;

  // Определяем нужно ли использовать Babel для jsx/tsx файлов
  const shouldUseBabel = (ext) => {
    return ext.toLowerCase() === "jsx" || ext.toLowerCase() === "tsx";
  };

  const shouldUseCSS = (ext) => {
    return (
      ext.toLowerCase() === "css" ||
      ext.toLowerCase() === "scss" ||
      ext.toLowerCase() === "sass"
    );
  };

  const isCSSModule = (ext, filename = "") => {
    return (
      shouldUseCSS(ext) &&
      (filename.includes(".module.") || options.isModule === true)
    );
  };

  const getSpecificOptions = (ext, filename = "") => {
    const extLower = ext.toLowerCase();

    if (shouldUseCSS(extLower)) {
      return {
        ...baseOptions,
        isModule: isCSSModule(extLower, filename),
      };
    }

    if (shouldUseBabel(extLower)) {
      return {
        ...baseOptions,
        typescript: extLower === "tsx",
      };
    }

    switch (extLower) {
      case "d.ts":
        return { ...baseOptions, declaration: true };
      case "ts":
      default:
        return baseOptions;
    }
  };

  const specificOptions = getSpecificOptions(
    fileExtension,
    options.filename || ""
  );
  const useBabel = shouldUseBabel(fileExtension.toLowerCase());
  const useCSS = shouldUseCSS(fileExtension.toLowerCase());

  return {
    validate: () => {
      if (useCSS) {
        currentErrors = validateCSS(code, specificOptions);
      } else if (useBabel) {
        currentErrors = validateBabel(code, specificOptions);
      } else {
        currentErrors = validateTypeScript(code, specificOptions);
      }
      return currentErrors;
    },
    process: () => {
      if (useCSS) {
        currentResult = processCSS(code, specificOptions);
      } else if (useBabel) {
        currentResult = processBabel(code, specificOptions);
      } else {
        currentResult = processTypeScript(code, specificOptions);
      }
      return currentResult;
    },
    get errors() {
      return currentErrors;
    },
    get result() {
      return currentResult;
    },
  };
}

module.exports = { createProcessor };
