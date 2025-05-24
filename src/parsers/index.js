const { parseTypeScript } = require("./typescript");
const { parseReact } = require("./react");

/**
 * Возвращает функцию парсера для указанного типа файла.
 * @param {string} fileExtension - Расширение файла (ts, tsx, js, jsx, d.ts).
 * @returns {Function|null} - Функция парсера или null, если парсер не найден.
 */
function getParser(fileExtension) {
  switch (fileExtension.toLowerCase()) {
    case "ts":
    case "js":
    case "d.ts": // .d.ts файлы парсятся так же, как обычные TS
      return parseTypeScript;
    case "tsx":
    case "jsx":
      return parseReact;
    default:
      return null;
  }
}

/**
 * Парсит файлы указанного типа и возвращает метаданные.
 * @param {string} fileExtension - Расширение файла.
 * @param {string[]} filePaths - Массив путей к файлам для парсинга.
 * @returns {Object} - Метаданные файлов.
 * @throws {Error} - Если парсер для типа файла не найден.
 */
function parseFiles(fileExtension, filePaths) {
  const parserFn = getParser(fileExtension);
  if (!parserFn) {
    throw new Error(`Нет парсера для типа файла: ${fileExtension}`);
  }

  return parserFn(filePaths);
}

module.exports = {
  getParser,
  parseFiles,
  parseTypeScript,
  parseReact,
};
