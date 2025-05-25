const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

/**
 * Создает временный файл с указанным содержимым.
 * @param {string} content - Содержимое файла.
 * @param {string} [extension=".ts"] - Расширение файла (включая точку).
 * @returns {string} - Путь к созданному временному файлу.
 */
function createTempFileWithContent(content, extension = ".ts") {
  const tempFile = tmp.fileSync({ postfix: extension, dir: os.tmpdir() });
  fs.writeFileSync(tempFile.name, content);
  return tempFile.name;
}

/**
 * Читает содержимое файла.
 * @param {string} filePath - Путь к файлу.
 * @returns {string} - Содержимое файла.
 */
function readFileContent(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Определяет тип файла по его расширению.
 * @param {string} filename - Имя файла.
 * @returns {string} - Тип файла (расширение без точки).
 */
function getFileType(filename) {
  if (filename.endsWith(".d.ts")) {
    return "d.ts";
  }
  const ext = path.extname(filename).toLowerCase();
  return ext ? ext.substring(1) : ""; // Удаляем точку из расширения
}

module.exports = {
  createTempFileWithContent,
  readFileContent,
  getFileType,
};
