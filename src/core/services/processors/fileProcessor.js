const ts = require("typescript");
const { getFileExtension } = require("../utils/fileExtensions");
const {
  validateTypeScriptInProject,
} = require("../validators/typescriptValidator");
const {
  validateBabelInProject,
  compileBabelFile,
} = require("../validators/babelValidator");

/**
 * Компилирует TypeScript файл
 * @param {string} content - содержимое файла
 * @returns {string} скомпилированный код
 */
function compileTypeScriptFile(content) {
  const transpileResult = ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      isolatedModules: true,
      allowJs: true,
    },
  });
  return transpileResult.outputText;
}

/**
 * Определяет выходное имя файла после компиляции
 * @param {string} filename - исходное имя файла
 * @param {string} extension - расширение файла
 * @returns {string} выходное имя файла
 */
function getOutputFileName(filename, extension) {
  if (extension === "d.ts") {
    return filename; // .d.ts файлы не изменяются
  }

  if (["tsx", "jsx", "ts"].includes(extension)) {
    return filename.replace(/\.(tsx|jsx|ts)$/, ".js");
  }

  return filename;
}

/**
 * Обрабатывает один файл в контексте множественных файлов
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @param {boolean} forceUseBabel - принудительно использовать Babel для всех файлов
 * @returns {Object} результат обработки
 */
function processFileInProject(
  filename,
  content,
  tempProject,
  forceUseBabel = false
) {
  const extension = getFileExtension(filename);

  // Определяем какой процессор использовать
  const shouldUseBabel =
    forceUseBabel || extension === "jsx" || extension === "tsx";

  try {
    // Валидация
    let errors = [];
    if (shouldUseBabel && extension !== "d.ts") {
      // Для смешанных проектов используем Babel валидацию для всех файлов кроме .d.ts
      errors = validateBabelInProject(filename, content, tempProject);

      // Дополнительно для .ts файлов запускаем TypeScript валидацию для полной проверки ошибок
      if (extension === "ts") {
        const tsErrors = validateTypeScriptInProject(
          filename,
          content,
          tempProject
        );
        // Объединяем ошибки, исключая дублирующиеся
        const combinedErrors = [...errors];
        tsErrors.forEach((tsError) => {
          const isDuplicate = errors.some(
            (babelError) =>
              babelError.message === tsError.message &&
              babelError.location?.line === tsError.location?.line &&
              babelError.location?.column === tsError.location?.column
          );
          if (!isDuplicate) {
            combinedErrors.push(tsError);
          }
        });
        errors = combinedErrors;
      }
    } else {
      // TypeScript валидация для .d.ts или когда нет jsx файлов в проекте
      errors = validateTypeScriptInProject(filename, content, tempProject);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        compiledCode: null,
        outputFileName: null,
      };
    }

    // Компиляция
    let compiledCode = "";
    const outputFileName = getOutputFileName(filename, extension);

    if (extension === "d.ts") {
      compiledCode = content; // .d.ts файлы не компилируются
    } else if (shouldUseBabel) {
      // Babel компиляция для всех файлов кроме .d.ts
      compiledCode = compileBabelFile(filename, content, tempProject);
    } else {
      // TypeScript компиляция (только для проектов без jsx)
      compiledCode = compileTypeScriptFile(content);
    }

    return {
      success: true,
      errors: [],
      compiledCode,
      outputFileName,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        { message: `Ошибка обработки файла ${filename}: ${error.message}` },
      ],
      compiledCode: null,
      outputFileName: null,
    };
  }
}

module.exports = {
  processFileInProject,
  compileTypeScriptFile,
  getOutputFileName,
};
