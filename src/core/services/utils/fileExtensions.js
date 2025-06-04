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

module.exports = {
  getFileExtension,
};
