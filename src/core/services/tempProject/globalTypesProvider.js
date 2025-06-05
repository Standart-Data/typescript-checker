const fs = require("fs");
const path = require("path");

/**
 * Загруженные модули с глобальными типами
 */
let LOADED_MODULES = null;

/**
 * Определяет side-effect импорты в файлах
 * @param {Object} files - файлы проекта {filename: content}
 * @returns {Set<string>} множество имён side-effect модулей
 */
/**
 * Загружает все доступные модули с глобальными типами
 * @returns {Array} массив загруженных модулей
 */
function loadGlobalModules() {
  if (LOADED_MODULES !== null) {
    return LOADED_MODULES;
  }

  LOADED_MODULES = [];
  const modulesDir = path.join(__dirname, "modules");

  try {
    if (fs.existsSync(modulesDir)) {
      const moduleFiles = fs.readdirSync(modulesDir);

      moduleFiles.forEach((filename) => {
        if (filename.endsWith(".js")) {
          try {
            const modulePath = path.join(modulesDir, filename);
            const moduleDefinition = require(modulePath);
            LOADED_MODULES.push(moduleDefinition);
          } catch (error) {
            console.warn(
              `Failed to load global module ${filename}:`,
              error.message
            );
          }
        }
      });
    }
  } catch (error) {
    console.warn("Failed to load global modules directory:", error.message);
  }

  return LOADED_MODULES;
}

function detectGlobalModules(files) {
  const foundModules = [];
  const modules = loadGlobalModules();

  Object.entries(files).forEach(([filename, content]) => {
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) {
      const lines = content.split("\n");

      lines.forEach((line) => {
        modules.forEach((module) => {
          let isModuleUsed = false;

          // Проверяем side-effect импорты
          if (module.isSideEffectImport && module.isSideEffectImport(line)) {
            isModuleUsed = true;
          }

          // Проверяем обычные импорты
          if (module.isRegularImport && module.isRegularImport(line)) {
            isModuleUsed = true;
          }

          if (
            isModuleUsed &&
            !foundModules.find(
              (m) => m.getModuleName() === module.getModuleName()
            )
          ) {
            foundModules.push(module);
          }
        });
      });
    }
  });

  return foundModules;
}

/**
 * Создаёт глобальные типы для обнаруженных модулей
 * @param {Array} globalModules - массив объектов модулей
 * @returns {string[]} массив строк с глобальными типами
 */
function createGlobalTypesForModules(globalModules) {
  const globalDeclarations = [];

  globalModules.forEach((module) => {
    if (module.getGlobalTypes) {
      globalDeclarations.push(module.getGlobalTypes());
    }
  });

  return globalDeclarations;
}

/**
 * Извлекает глобальные типы из .d.ts файлов
 * @param {Object} files - файлы проекта {filename: content}
 * @returns {string[]} массив глобальных деклараций
 */
function extractGlobalTypesFromDtsFiles(files) {
  const globalDeclarations = [];

  Object.entries(files).forEach(([filename, content]) => {
    if (filename.endsWith(".d.ts")) {
      // Извлекаем глобальные декларации из .d.ts файлов
      const globalMatch = content.match(/declare global\s*\{([^}]+)\}/s);
      if (globalMatch) {
        globalDeclarations.push(globalMatch[1].trim());
      }
    }
  });

  return globalDeclarations;
}

/**
 * Создаёт полный контент файла глобальных типов
 * @param {Object} files - файлы проекта {filename: content}
 * @returns {string|null} содержимое global.d.ts или null если типы не нужны
 */
function createGlobalTypesContent(files) {
  const globalDeclarations = [];

  // Извлекаем типы из .d.ts файлов
  const dtsTypes = extractGlobalTypesFromDtsFiles(files);
  globalDeclarations.push(...dtsTypes);

  // Создаём типы для модулей с глобальными типами
  const globalModules = detectGlobalModules(files);
  const moduleTypes = createGlobalTypesForModules(globalModules);
  globalDeclarations.push(...moduleTypes);

  // Создаем единый файл глобальных типов
  if (globalDeclarations.length > 0) {
    return `declare global {\n${globalDeclarations.join(
      "\n"
    )}\n}\n\nexport {};`;
  }

  return null;
}

/**
 * Получает зарегистрированные модули
 * @returns {Array} массив загруженных модулей
 */
function getRegisteredModules() {
  return loadGlobalModules();
}

module.exports = {
  detectGlobalModules,
  createGlobalTypesForModules,
  extractGlobalTypesFromDtsFiles,
  createGlobalTypesContent,
  getRegisteredModules,
};
