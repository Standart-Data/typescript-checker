const ts = require("typescript");
const path = require("path");
const fs = require("fs");

/**
 * Создает кастомный компилятор host с разрешением модулей через заглушки
 * @param {Object} compilerOptions - настройки компилятора
 * @param {Object} tempProject - временный проект
 * @returns {Object} компилятор host
 */
function createCustomCompilerHost(compilerOptions, tempProject) {
  const host = ts.createCompilerHost(compilerOptions);

  // Переопределяем resolveModuleNames для принудительного использования наших заглушек
  const originalResolveModuleNames = host.resolveModuleNames;
  host.resolveModuleNames = (
    moduleNames,
    containingFile,
    reusedNames,
    redirectedReference,
    options
  ) => {
    return moduleNames.map((moduleName) => {
      // Для локальных импортов (начинающихся с ./ или ../) используем стандартное разрешение
      if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
        if (originalResolveModuleNames) {
          const resolved = originalResolveModuleNames.call(
            host,
            [moduleName],
            containingFile,
            reusedNames,
            redirectedReference,
            options
          );
          return resolved[0];
        } else {
          // Если originalResolveModuleNames отсутствует, используем стандартное разрешение TypeScript
          const result = ts.resolveModuleName(
            moduleName,
            containingFile,
            options,
            ts.sys
          );
          return result.resolvedModule;
        }
      }

      // Для внешних модулей проверяем, есть ли наша заглушка модуля
      const stubPath = path.join(
        tempProject.tempDir.name,
        "node_modules",
        moduleName,
        "index.d.ts"
      );
      if (fs.existsSync(stubPath)) {
        return {
          resolvedFileName: stubPath,
          isExternalLibraryImport: true,
        };
      }

      // Используем стандартное разрешение для остальных случаев
      if (originalResolveModuleNames) {
        const resolved = originalResolveModuleNames.call(
          host,
          [moduleName],
          containingFile,
          reusedNames,
          redirectedReference,
          options
        );
        return resolved[0];
      }

      return undefined;
    });
  };

  return host;
}

/**
 * Создает конфигурацию компилятора из tsconfig.json
 * @param {Object} tempProject - временный проект
 * @returns {Object} настройки компилятора
 */
function createCompilerOptions(tempProject) {
  // Читаем tsconfig.json из временной директории
  const tsConfigPath = path.join(tempProject.tempDir.name, "tsconfig.json");
  const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);

  if (configFile.error) {
    console.warn("Ошибка чтения tsconfig.json:", configFile.error);
  }

  // Парсим конфигурацию с учетом baseUrl
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config || {},
    ts.sys,
    tempProject.tempDir.name,
    undefined,
    tsConfigPath
  );

  return parsedConfig.options;
}

/**
 * Валидирует все TypeScript файлы в проекте одновременно
 * @param {Object} tsFiles - объект с TypeScript файлами {filename: content}
 * @param {Object} tempProject - информация о временном проекте
 * @returns {Object} результат валидации по файлам
 */
function validateAllTypeScriptInProject(tsFiles, tempProject) {
  try {
    const compilerOptions = createCompilerOptions(tempProject);
    const allFiles = Object.values(tempProject.fileMap);
    const host = createCustomCompilerHost(compilerOptions, tempProject);
    const program = ts.createProgram(allFiles, compilerOptions, host);

    // Получаем диагностику для всех файлов сразу
    const allDiagnostics = ts.getPreEmitDiagnostics(program);

    // Группируем ошибки по файлам
    const errorsByFile = {};

    Object.keys(tsFiles).forEach((filename) => {
      errorsByFile[filename] = [];
    });

    allDiagnostics.forEach((diagnostic) => {
      if (diagnostic.file) {
        const fileName = path.basename(diagnostic.file.fileName);

        // Находим соответствующий файл из нашего списка
        const targetFile = Object.keys(tsFiles).find(
          (filename) => filename === fileName
        );

        if (targetFile) {
          const { line, character } =
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

          errorsByFile[targetFile].push({
            location: {
              line: line + 1,
              column: character + 1,
            },
            message: ts.flattenDiagnosticMessageText(
              diagnostic.messageText,
              "\n"
            ),
          });
        }
      } else {
        // Глобальные ошибки добавляем ко всем файлам
        const globalError = {
          message: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          ),
        };

        Object.keys(tsFiles).forEach((filename) => {
          errorsByFile[filename].push(globalError);
        });
      }
    });

    return errorsByFile;
  } catch (error) {
    console.error("Ошибка валидации TypeScript проекта:", error);
    const errorResult = {};
    Object.keys(tsFiles).forEach((filename) => {
      errorResult[filename] = [{ message: error.message }];
    });
    return errorResult;
  }
}

/**
 * Валидирует TypeScript файл в контексте всего проекта
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @returns {Array} массив ошибок
 */
function validateTypeScriptInProject(filename, content, tempProject) {
  try {
    const compilerOptions = createCompilerOptions(tempProject);
    const allFiles = Object.values(tempProject.fileMap);
    const host = createCustomCompilerHost(compilerOptions, tempProject);
    const program = ts.createProgram(allFiles, compilerOptions, host);
    const sourceFile = program.getSourceFile(tempProject.fileMap[filename]);

    if (!sourceFile) {
      return [{ message: `Не удалось найти файл ${filename} в проекте` }];
    }

    // Получаем диагностику включая глобальные типы
    const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

    const errors = diagnostics.map((diagnostic) => {
      if (diagnostic.file) {
        const { line, character } =
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return {
          location: {
            line: line + 1,
            column: character + 1,
          },
          message: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          ),
        };
      } else {
        return {
          message: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          ),
        };
      }
    });

    return errors;
  } catch (error) {
    console.error(`Ошибка валидации ${filename}:`, error);
    return [{ message: error.message }];
  }
}

module.exports = {
  validateAllTypeScriptInProject,
  validateTypeScriptInProject,
  createCustomCompilerHost,
  createCompilerOptions,
};
