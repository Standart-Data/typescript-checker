const { getFileExtension } = require("../utils/fileExtensions");
const { createTempProject } = require("../tempProject/tempProjectManager");
const {
  validateAllTypeScriptInProject,
} = require("../validators/typescriptValidator");
const { processFileInProject } = require("./fileProcessor");

/**
 * Разделяет файлы на TypeScript/JavaScript и CSS
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} разделенные файлы {tsFiles, cssFiles}
 */
function separateFilesByType(files) {
  const tsFiles = {};
  const cssFiles = {};

  Object.entries(files).forEach(([filename, content]) => {
    const extension = getFileExtension(filename);
    if (["css", "scss", "sass"].includes(extension)) {
      cssFiles[filename] = content;
    } else {
      tsFiles[filename] = content;
    }
  });

  return { tsFiles, cssFiles };
}

/**
 * Обрабатывает CSS файлы (возвращает как есть)
 * @param {Object} cssFiles - CSS файлы
 * @returns {Object} результат обработки CSS файлов
 */
function processCssFiles(cssFiles) {
  const processedFiles = {};
  const compiledFiles = {};

  Object.entries(cssFiles).forEach(([filename, content]) => {
    processedFiles[filename] = {
      success: true,
      errors: [],
      compiledCode: content, // CSS возвращаем как есть
      outputFileName: filename,
    };
    compiledFiles[filename] = content;
  });

  return { processedFiles, compiledFiles };
}

/**
 * Определяет есть ли JSX файлы в проекте
 * @param {Object} tsFiles - TypeScript/JavaScript файлы
 * @returns {boolean} есть ли JSX файлы
 */
function hasJsxFiles(tsFiles) {
  return Object.keys(tsFiles).some((filename) => {
    const extension = getFileExtension(filename);
    return extension === "jsx" || extension === "tsx";
  });
}

/**
 * Получает только чистые TypeScript файлы (.ts и .d.ts)
 * @param {Object} tsFiles - TypeScript/JavaScript файлы
 * @returns {Object} только .ts и .d.ts файлы
 */
function getPureTypeScriptFiles(tsFiles) {
  const pureTsFiles = {};
  Object.entries(tsFiles).forEach(([filename, content]) => {
    const extension = getFileExtension(filename);
    if (extension === "ts" || extension === "d.ts") {
      pureTsFiles[filename] = content;
    }
  });
  return pureTsFiles;
}

/**
 * Объединяет ошибки без дублирования
 * @param {Array} existingErrors - существующие ошибки
 * @param {Array} newErrors - новые ошибки
 * @returns {Array} объединенные ошибки
 */
function mergeErrorsWithoutDuplicates(existingErrors, newErrors) {
  const combinedErrors = [...existingErrors];

  newErrors.forEach((newError) => {
    const isDuplicate = existingErrors.some(
      (existingError) =>
        existingError.message === newError.message &&
        existingError.location?.line === newError.location?.line &&
        existingError.location?.column === newError.location?.column
    );
    if (!isDuplicate) {
      combinedErrors.push(newError);
    }
  });

  return combinedErrors;
}

/**
 * Обрабатывает TypeScript/JavaScript файлы
 * @param {Object} tsFiles - TypeScript/JavaScript файлы
 * @param {Object} tempProject - временный проект
 * @returns {Object} результат обработки
 */
function processTypeScriptFiles(tsFiles, tempProject) {
  const results = {
    processedFiles: {},
    compiledFiles: {},
    allErrors: [],
  };

  const hasJsx = hasJsxFiles(tsFiles);

  // Если есть jsx файлы, сначала выполняем общую TypeScript валидацию для всех .ts файлов
  let allTsErrors = {};
  if (hasJsx) {
    const pureTsFiles = getPureTypeScriptFiles(tsFiles);
    if (Object.keys(pureTsFiles).length > 0) {
      allTsErrors = validateAllTypeScriptInProject(pureTsFiles, tempProject);
    }
  }

  // Обрабатываем каждый файл
  for (const [filename, content] of Object.entries(tsFiles)) {
    const extension = getFileExtension(filename);

    // Если в проекте есть jsx файлы, используем Babel для всех файлов
    const result = processFileInProject(filename, content, tempProject, hasJsx);

    // Если у нас есть дополнительные TypeScript ошибки для этого файла, добавляем их
    if (hasJsx && extension === "ts" && allTsErrors[filename]) {
      const additionalTsErrors = allTsErrors[filename];
      const combinedErrors = mergeErrorsWithoutDuplicates(
        result.errors,
        additionalTsErrors
      );

      // Обновляем результат с дополнительными ошибками
      if (combinedErrors.length > result.errors.length) {
        result.errors = combinedErrors;
        if (result.success && combinedErrors.length > 0) {
          result.success = false;
          result.compiledCode = null;
        }
      }
    }

    results.processedFiles[filename] = result;
    results.allErrors.push(...result.errors);

    if (result.success && result.compiledCode) {
      results.compiledFiles[result.outputFileName] = result.compiledCode;
    }
  }

  return results;
}

/**
 * Обрабатывает множество файлов с правильным разрешением зависимостей
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} результат обработки всех файлов
 */
function processMultipleFiles(files) {
  // Разделяем файлы на TypeScript/JavaScript и CSS
  const { tsFiles, cssFiles } = separateFilesByType(files);

  const results = {
    compiledFiles: {},
    allErrors: [],
    processedFiles: {},
  };

  // Обрабатываем CSS файлы отдельно
  const cssResults = processCssFiles(cssFiles);
  Object.assign(results.processedFiles, cssResults.processedFiles);
  Object.assign(results.compiledFiles, cssResults.compiledFiles);

  // Если есть TypeScript/JavaScript файлы, обрабатываем их
  if (Object.keys(tsFiles).length > 0) {
    const tempProject = createTempProject(tsFiles);

    try {
      const tsResults = processTypeScriptFiles(tsFiles, tempProject);

      Object.assign(results.processedFiles, tsResults.processedFiles);
      Object.assign(results.compiledFiles, tsResults.compiledFiles);
      results.allErrors.push(...tsResults.allErrors);
    } finally {
      tempProject.cleanup();
    }
  }

  return results;
}

module.exports = {
  processMultipleFiles,
  separateFilesByType,
  processCssFiles,
  processTypeScriptFiles,
  hasJsxFiles,
  getPureTypeScriptFiles,
  mergeErrorsWithoutDuplicates,
};
