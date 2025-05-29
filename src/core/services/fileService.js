const { createProcessor } = require("../../processors");

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
  return filename.replace(extension === "tsx" ? ".tsx" : ".ts", ".js");
}

/**
 * Обрабатывает один файл: валидирует и компилирует
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @returns {Object} результат обработки
 */
function processFile(filename, content) {
  const extension = getFileExtension(filename);

  // Поддерживаем только TypeScript файлы
  if (!["ts", "tsx", "d.ts"].includes(extension)) {
    return {
      success: false,
      errors: [{ message: `Неподдерживаемый тип файла: ${extension}` }],
      compiledCode: null,
      outputFileName: null,
    };
  }

  try {
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
 * Обрабатывает множество файлов
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} результат обработки всех файлов
 */
function processFiles(files) {
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

module.exports = {
  getFileExtension,
  getOutputFileName,
  processFile,
  processFiles,
};
