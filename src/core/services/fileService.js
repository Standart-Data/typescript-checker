const { createProcessor } = require("../../processors");
const { processMultipleFiles } = require("./multiFileService");

/**
 * Определяет расширение файла с учетом .d.ts
 * @param {string} filename - имя файла
 * @returns {string} расширение файла
 */
function getFileExtension(filename) {
  if (filename.endsWith(".d.ts")) {
    return "d.ts";
  }
  return filename.split(".").pop().toLowerCase();
}

/**
 * Определяет имя выходного файла после компиляции
 * @param {string} filename - имя исходного файла
 * @param {string} extension - расширение файла
 * @returns {string} имя выходного файла
 */
function getOutputFileName(filename, extension) {
  if (extension === "d.ts") {
    return filename;
  }

  switch (extension) {
    case "tsx":
    case "jsx":
      return filename.replace(/\.(tsx|jsx)$/, ".js");
    case "ts":
      return filename.replace(/\.ts$/, ".js");
    default:
      return filename;
  }
}

/**
 * Обрабатывает один файл: валидирует и компилирует
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @returns {Object} результат обработки
 */
function processFile(filename, content) {
  const extension = getFileExtension(filename);

  // Поддерживаем TypeScript, JSX, TSX и CSS файлы
  if (
    !["ts", "tsx", "jsx", "d.ts", "css", "scss", "sass"].includes(extension)
  ) {
    return {
      success: false,
      errors: [{ message: `Неподдерживаемый тип файла: ${extension}` }],
      compiledCode: null,
      outputFileName: null,
    };
  }

  try {
    // Для CSS файлов не нужна компиляция, только парсинг
    if (["css", "scss", "sass"].includes(extension)) {
      return {
        success: true,
        errors: [],
        compiledCode: content, // CSS возвращаем как есть
        outputFileName: filename, // CSS файлы не изменяют имя
      };
    }

    const processor = createProcessor(extension, content);
    const errors = processor.validate();

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        compiledCode: null,
        outputFileName: null,
      };
    }

    const compiledCode = processor.process();
    const outputFileName = getOutputFileName(filename, extension);

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

/**
 * Обрабатывает множество файлов с правильным разрешением зависимостей
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} результат обработки всех файлов
 */
function processFiles(files) {
  const fileCount = Object.keys(files).length;

  // Если только один файл, используем старый метод для обратной совместимости
  if (fileCount === 1) {
    const results = {
      compiledFiles: {},
      allErrors: [],
      processedFiles: {},
    };

    for (const [filename, content] of Object.entries(files)) {
      const result = processFile(filename, content);

      results.processedFiles[filename] = result;
      results.allErrors.push(...result.errors);

      if (result.success && result.compiledCode) {
        results.compiledFiles[result.outputFileName] = result.compiledCode;
      }
    }

    return results;
  }

  // Для множественных файлов используем новый сервис
  return processMultipleFiles(files);
}

module.exports = {
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
};
