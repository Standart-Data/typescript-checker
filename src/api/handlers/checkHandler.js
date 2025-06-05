const {
  processFile,
  processFiles,
} = require("../../core/services/fileService");
const {
  processMultipleFiles,
} = require("../../core/services/multiFileService");
const { extractMetadata } = require("../../core/services/metadataService");

/**
 * Валидирует входные данные запроса
 * @param {Object} requestBody - тело запроса с файлами
 * @returns {Object} результат валидации
 */
function validateRequest(requestBody) {
  if (!requestBody || typeof requestBody !== "object") {
    return {
      isValid: false,
      error: "Неверный формат запроса",
    };
  }

  const files = Object.keys(requestBody);

  if (files.length === 0) {
    return {
      isValid: false,
      error: "Нет файлов для обработки",
    };
  }

  // Проверяем, что все значения являются строками (содержимое файлов)
  for (const [filename, content] of Object.entries(requestBody)) {
    if (typeof content !== "string") {
      return {
        isValid: false,
        error: `Содержимое файла ${filename} должно быть строкой`,
      };
    }
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Проверяет содержит ли файл импорты
 * @param {string} content - содержимое файла
 * @returns {boolean} true если файл содержит импорты
 */
function hasImports(content) {
  const importRegex = /^\s*import\s+.*?from\s+['"`].*?['"`]\s*;?/gm;
  const sideEffectImportRegex = /^\s*import\s+['"`].*?['"`]\s*;?/gm;
  const requireRegex = /require\s*\(\s*['"`].*?['"`]\s*\)/g;
  return (
    importRegex.test(content) ||
    sideEffectImportRegex.test(content) ||
    requireRegex.test(content)
  );
}

/**
 * Основная функция обработки запроса
 * @param {Object} requestBody - тело запроса с файлами
 * @returns {Object} результат обработки
 */
function handleCheckRequest(requestBody) {
  try {
    // 1. Валидируем запрос
    const validation = validateRequest(requestBody);
    if (!validation.isValid) {
      return {
        success: false,
        statusCode: 400,
        response: {
          errors: [{ message: validation.error }],
          result: {},
          metadata: {},
        },
      };
    }

    const files = Object.keys(requestBody);

    // 2. Определяем путь обработки
    if (files.length === 1) {
      const [filename] = files;
      const content = requestBody[filename];

      // Если файл содержит импорты, используем multiFileService
      if (hasImports(content)) {
        const processResult = processMultipleFiles(requestBody);
        const metadata = extractMetadata(requestBody);

        return {
          success: true,
          statusCode: 200,
          response: {
            errors: processResult.allErrors,
            result: processResult.compiledFiles,
            metadata: metadata,
          },
        };
      }

      // Иначе используем старый метод для файлов без импортов
      const processResult = processFile(filename, content);
      const metadata = extractMetadata(requestBody);

      return {
        success: processResult.success,
        statusCode: processResult.success ? 200 : 400,
        response: {
          errors: processResult.success ? [] : processResult.errors,
          result: processResult.success
            ? {
                [processResult.outputFileName || filename]:
                  processResult.compiledCode || content,
              }
            : {},
          metadata: metadata,
        },
      };
    } else {
      // Множественные файлы -> multiFileService (обрабатывает все типы файлов)
      const processResult = processMultipleFiles(requestBody);
      const metadata = extractMetadata(requestBody);

      return {
        success: true,
        statusCode: 200,
        response: {
          errors: processResult.allErrors,
          result: processResult.compiledFiles,
          metadata: metadata,
        },
      };
    }
  } catch (error) {
    console.error("Ошибка в handleCheckRequest:", error);

    return {
      success: false,
      statusCode: 500,
      response: {
        errors: [{ message: `Внутренняя ошибка сервера: ${error.message}` }],
        result: {},
        metadata: {},
      },
    };
  }
}

module.exports = {
  validateRequest,
  handleCheckRequest,
  hasImports,
};
