// Импортируем существующий парсер React
const { parseReact: originalParseReact } = require("../parser/react");

/**
 * Парсит React/JSX файлы и извлекает метаданные
 * @param {string[]} filePaths - Массив путей к файлам для парсинга
 * @returns {Object} - Объект с метаданными
 */
function parseReact(filePaths) {
  return originalParseReact(filePaths);
}

module.exports = {
  parseReact,
};
