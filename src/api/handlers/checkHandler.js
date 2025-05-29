const { processFiles } = require("../../core/services/fileService");
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
 * Форматирует финальный ответ
 * @param {Object} processResult - результат обработки файлов
 * @param {Object} metadata - метаданные файлов
 * @returns {Object} отформатированный ответ
 */
function formatResponse(processResult, metadata) {
  return {
    errors: processResult.allErrors,
    result: processResult.compiledFiles,
    metadata: metadata,
  };
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

    // 2. Обрабатываем файлы (валидация + компиляция)
    const processResult = processFiles(requestBody);

    // 3. Извлекаем метаданные
    const metadata = extractMetadata(requestBody);

    // 4. Формируем ответ
    const response = formatResponse(processResult, metadata);

    return {
      success: true,
      statusCode: 200,
      response,
    };
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
  formatResponse,
  handleCheckRequest,
};
