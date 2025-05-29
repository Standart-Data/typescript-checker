const { validateTypeScript, processTypeScript } = require("./typescript");

/**
 * Создает "процессор" для указанного типа файла,
 * возвращая объект с функциями validate и process.
 * @param {string} fileExtension - Расширение файла (ts, tsx, d.ts).
 * @param {string} code - Содержимое файла.
 * @param {Object} options - Дополнительные опции.
 * @returns {{validate: Function, process: Function, errors: Array, result: string}} - Объект с методами и свойствами.
 */
function createProcessor(fileExtension, code, options = {}) {
  let currentErrors = [];
  let currentResult = "";

  const baseOptions = options;

  const getSpecificOptions = (ext) => {
    switch (ext.toLowerCase()) {
      case "tsx":
        return {
          ...baseOptions,
          jsx: true,
          jsxFactory: "React.createElement",
          jsxFragmentFactory: "React.Fragment",
        };
      case "d.ts":
        return { ...baseOptions, declaration: true };
      case "ts":
      default:
        return baseOptions;
    }
  };

  const specificOptions = getSpecificOptions(fileExtension);

  return {
    validate: () => {
      currentErrors = validateTypeScript(code, specificOptions);
      return currentErrors;
    },
    process: () => {
      // Валидация перед компиляцией, если еще не была вызвана
      if (currentErrors.length === 0 && !specificOptions.declaration) {
        // Для .d.ts не нужна предварительная валидация перед process
        // Если validate не вызывался, currentErrors будет пуст. Мы можем здесь вызвать validate,
        // но это изменит контракт, так как validate() будет вызываться неявно.
        // Вместо этого, мы можем просто полагаться, что пользователь вызовет validate() первым, если ему нужны ошибки.
        // Для простоты, если process вызывается первым, он просто компилирует.
      }
      currentResult = processTypeScript(code, specificOptions);
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
