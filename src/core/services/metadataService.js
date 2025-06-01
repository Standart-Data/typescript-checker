const { getParser } = require("../parsers");
const { createTempFileWithContent } = require("../../utils");
const { getFileExtension } = require("./fileService");
const { createUnifiedContext } = require("./dependencyService");

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

  // Затем main.tsx
  const mainTsx = fileNames.find((name) => name === "main.tsx");
  if (mainTsx) {
    return mainTsx;
  }

  // Затем main.jsx
  const mainJsx = fileNames.find((name) => name === "main.jsx");
  if (mainJsx) {
    return mainJsx;
  }

  // Если нет main файлов, берем первый файл
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
 * Извлекает метаданные из множества файлов с учетом зависимостей
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} структурированные метаданные с разрешенными зависимостями
 */
function extractMetadata(files) {
  const mainFileName = getMainFileName(files);
  const filesMetadata = {};

  // Сначала извлекаем метаданные из каждого файла отдельно
  for (const [filename, content] of Object.entries(files)) {
    const result = extractFileMetadata(filename, content);

    if (result.success) {
      filesMetadata[filename] = result.metadata;
    } else {
      filesMetadata[filename] = {
        error: result.message,
        functions: {},
        variables: {},
        classes: {},
        interfaces: {},
        types: {},
        enums: {},
        imports: {},
        exports: {},
      };
    }
  }

  // Создаем унифицированный контекст с разрешенными зависимостями
  const unifiedContext = createUnifiedContext(files, filesMetadata);

  // Формируем финальный результат
  const metadata = {
    files: filesMetadata,
    // Информация о зависимостях
    dependencies: unifiedContext.dependencies,
    globalDeclarations: unifiedContext.globalDeclarations,
    // Метаданные главного файла копируем в корень для обратной совместимости
    ...getMainFileMetadata(filesMetadata[mainFileName] || {}),
  };

  return metadata;
}

/**
 * Извлекает метаданные главного файла для корня ответа
 * @param {Object} mainFileMetadata - метаданные главного файла
 * @returns {Object} метаданные для корня
 */
function getMainFileMetadata(mainFileMetadata) {
  const rootMetadata = {};

  // Копируем основные категории из главного файла
  const categories = [
    "functions",
    "variables",
    "classes",
    "interfaces",
    "types",
    "enums",
    "imports",
    "exports",
    "declarations",
    "modules",
    "namespaces",
    "components",
    "hooks",
  ];

  categories.forEach((category) => {
    rootMetadata[category] = mainFileMetadata[category] || {};
  });

  return rootMetadata;
}

module.exports = {
  getMainFileName,
  extractFileMetadata,
  extractMetadata,
};
