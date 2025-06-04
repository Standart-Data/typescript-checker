// MultiFileService - Модульная архитектура
// Обработка множественных TypeScript/JavaScript файлов с поддержкой импортов

// Утилиты
const { getFileExtension } = require("./utils/fileExtensions");

// Управление временными проектами
const {
  createTempProject,
  createTsConfig,
  createPackageJson,
  createGlobalTypes,
} = require("./tempProject/tempProjectManager");

// Заглушки модулей
const {
  COMMON_MODULES,
  createTypeDefinition,
  createModuleStubs,
} = require("./tempProject/moduleStubs");

// TypeScript валидация
const {
  validateAllTypeScriptInProject,
  validateTypeScriptInProject,
  createCustomCompilerHost,
  createCompilerOptions,
} = require("./validators/typescriptValidator");

// Babel валидация
const {
  validateBabelInProject,
  compileBabelFile,
  createBabelValidationConfig,
  createBabelCompilationConfig,
} = require("./validators/babelValidator");

// Обработка файлов
const {
  processFileInProject,
  compileTypeScriptFile,
  getOutputFileName,
} = require("./processors/fileProcessor");

// Обработка множественных файлов
const {
  processMultipleFiles,
  separateFilesByType,
  processCssFiles,
  processTypeScriptFiles,
  hasJsxFiles,
  getPureTypeScriptFiles,
  mergeErrorsWithoutDuplicates,
} = require("./processors/multiFileProcessor");

// Экспортируем основные функции для обратной совместимости
module.exports = {
  // Основные функции
  createTempProject,
  validateAllTypeScriptInProject,
  validateTypeScriptInProject,
  validateBabelInProject,
  processFileInProject,
  processMultipleFiles,

  // Утилиты
  getFileExtension,

  // Временные проекты
  createTsConfig,
  createPackageJson,
  createGlobalTypes,

  // Заглушки модулей
  COMMON_MODULES,
  createTypeDefinition,
  createModuleStubs,

  // TypeScript валидация
  createCustomCompilerHost,
  createCompilerOptions,

  // Babel валидация и компиляция
  compileBabelFile,
  createBabelValidationConfig,
  createBabelCompilationConfig,

  // Обработка файлов
  compileTypeScriptFile,
  getOutputFileName,

  // Обработка множественных файлов
  separateFilesByType,
  processCssFiles,
  processTypeScriptFiles,
  hasJsxFiles,
  getPureTypeScriptFiles,
  mergeErrorsWithoutDuplicates,
};
