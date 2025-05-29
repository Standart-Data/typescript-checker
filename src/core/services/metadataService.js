const { getParser } = require("../parsers");
const { createTempFileWithContent } = require("../../utils");
const { getFileExtension } = require("./fileService");

/**
 * Определяет главный файл из списка файлов
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {string} имя главного файла
 */
function getMainFileName(files) {
  const fileNames = Object.keys(files);

  // Приоритет отдаем main.ts
  const mainTs = fileNames.find((name) => name === "main.ts");
  if (mainTs) {
    return mainTs;
  }

  // Если нет main.ts, берем первый файл
  return fileNames[0];
}

/**
 * Извлекает метаданные из одного файла
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @returns {Object} метаданные файла
 */
function extractFileMetadata(filename, content) {
  try {
    const extension = getFileExtension(filename);

    // Создаем временный файл
    const tempFilePath = createTempFileWithContent(content, `.${extension}`);

    // Получаем парсер для данного типа файла
    const parserFn = getParser(extension);

    if (!parserFn) {
      return {
        success: false,
        message: `Парсер для типа файла ${extension} не реализован`,
        metadata: {},
      };
    }

    // Извлекаем метаданные
    const metadata = parserFn([tempFilePath]);

    return {
      success: true,
      message: null,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка извлечения метаданных из ${filename}: ${error.message}`,
      metadata: {},
    };
  }
}

/**
 * Извлекает метаданные из множества файлов
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} структурированные метаданные
 */
function extractMetadata(files) {
  const mainFileName = getMainFileName(files);
  const metadata = {
    files: {},
    // Здесь будут поля из главного файла
  };

  // Обрабатываем каждый файл
  for (const [filename, content] of Object.entries(files)) {
    const result = extractFileMetadata(filename, content);

    if (result.success) {
      metadata.files[filename] = result.metadata;

      // Если это главный файл, копируем его метаданные в корень
      if (filename === mainFileName) {
        Object.keys(result.metadata).forEach((key) => {
          if (key !== "files") {
            metadata[key] = result.metadata[key];
          }
        });
      }
    } else {
      metadata.files[filename] = {
        error: result.message,
      };
    }
  }

  return metadata;
}

module.exports = {
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
};
