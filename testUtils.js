const fs = require("fs");
const path = require("path");
const { handleCheckRequest } = require("./src/api/handlers/checkHandler");

/**
 * Служебная функция для проверки файлов через эндпоинт /check
 * Имитирует поведение UI тренажера для быстрого тестирования уроков
 *
 * @param {string[]} fileNames - массив названий файлов для проверки
 * @param {string} [baseDir] - базовая директория (по умолчанию текущая)
 * @returns {{ result: Object, metadata: Object }} результат проверки
 */
function checkFiles(fileNames, baseDir = process.cwd()) {
  // Читаем содержимое файлов
  const files = {};
  for (const fileName of fileNames) {
    const filePath = path.join(baseDir, fileName);
    files[fileName] = fs.readFileSync(filePath, "utf8");
  }

  // Имитируем запрос к эндпоинту /check
  const checkResult = handleCheckRequest(files);

  // Получаем данные как из UI тренажера
  const metadata = checkResult.response.metadata;
  const result = checkResult.response.result;

  // Выводим metadata в консоль
  console.log(JSON.stringify(metadata, null, 2));

  return { result, metadata };
}

module.exports = {
  checkFiles,
};
