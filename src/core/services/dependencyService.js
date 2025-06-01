const path = require("path");
const { getFileExtension } = require("./fileService");

/**
 * Нормализует путь модуля для разрешения импортов
 * @param {string} modulePath - путь модуля
 * @param {string} currentFile - текущий файл
 * @param {Object} files - все файлы в проекте
 * @returns {string|null} нормализованный путь или null если не найден
 */
function resolveModulePath(modulePath, currentFile, files) {
  // Если это относительный импорт
  if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
    const currentDir = path.dirname(currentFile);
    const resolvedPath = path.resolve(currentDir, modulePath);

    // Пробуем найти файл с разными расширениями
    const possibleExtensions = [".ts", ".tsx", ".jsx", ".d.ts", ".js"];
    const possibleFiles = [
      resolvedPath,
      ...possibleExtensions.map((ext) => resolvedPath + ext),
      ...possibleExtensions.map((ext) =>
        path.join(resolvedPath, "index" + ext)
      ),
    ];

    for (const possibleFile of possibleFiles) {
      const relativePath = path.relative(".", possibleFile);
      if (files[relativePath] || files[possibleFile]) {
        return relativePath;
      }
    }
  }

  return null;
}

/**
 * Извлекает импорты из метаданных файла
 * @param {Object} metadata - метаданные файла
 * @returns {Array} массив импортов
 */
function extractImports(metadata) {
  const imports = [];

  if (metadata.imports) {
    Object.entries(metadata.imports).forEach(([modulePath, importInfo]) => {
      imports.push({
        module: modulePath,
        namedImports: importInfo.namedImports || [],
        defaultImport: importInfo.defaultImport || null,
        isExternal:
          !modulePath.startsWith("./") && !modulePath.startsWith("../"),
      });
    });
  }

  return imports;
}

/**
 * Извлекает экспорты из метаданных файла
 * @param {Object} metadata - метаданные файла
 * @returns {Object} объект с экспортами
 */
function extractExports(metadata) {
  const exports = {
    named: {},
    default: null,
    types: {},
    interfaces: {},
    enums: {},
    functions: {},
    variables: {},
  };

  // Экспорты функций
  if (metadata.functions) {
    Object.values(metadata.functions).forEach((func) => {
      if (func.isExported) {
        exports.functions[func.name] = func;
        exports.named[func.name] = func;
      }
    });
  }

  // Экспорты переменных
  if (metadata.variables) {
    Object.values(metadata.variables).forEach((variable) => {
      if (variable.isExported) {
        exports.variables[variable.name] = variable;
        exports.named[variable.name] = variable;
      }
    });
  }

  // Экспорты типов
  if (metadata.types) {
    Object.values(metadata.types).forEach((type) => {
      if (type.isExported) {
        exports.types[type.name] = type;
        exports.named[type.name] = type;
      }
    });
  }

  // Экспорты интерфейсов
  if (metadata.interfaces) {
    Object.values(metadata.interfaces).forEach((iface) => {
      if (iface.isExported) {
        exports.interfaces[iface.name] = iface;
        exports.named[iface.name] = iface;
      }
    });
  }

  // Экспорты энумов
  if (metadata.enums) {
    Object.values(metadata.enums).forEach((enumObj) => {
      if (enumObj.isExported) {
        exports.enums[enumObj.name] = enumObj;
        exports.named[enumObj.name] = enumObj;
      }
    });
  }

  // Именованные экспорты
  if (metadata.exports && metadata.exports.namedExports) {
    metadata.exports.namedExports.forEach((namedExport) => {
      if (typeof namedExport === "string") {
        exports.named[namedExport] = { name: namedExport, type: "unknown" };
      } else if (namedExport.name) {
        exports.named[namedExport.name] = namedExport;
      }
    });
  }

  return exports;
}

/**
 * Строит граф зависимостей между файлами
 * @param {Object} files - все файлы проекта
 * @param {Object} filesMetadata - метаданные всех файлов
 * @returns {Object} граф зависимостей
 */
function buildDependencyGraph(files, filesMetadata) {
  const graph = {};
  const exports = {};

  // Сначала собираем все экспорты
  Object.entries(filesMetadata).forEach(([filename, metadata]) => {
    exports[filename] = extractExports(metadata);
    graph[filename] = {
      imports: [],
      dependsOn: [],
      dependents: [],
    };
  });

  // Затем разрешаем импорты
  Object.entries(filesMetadata).forEach(([filename, metadata]) => {
    const imports = extractImports(metadata);

    imports.forEach((importInfo) => {
      if (!importInfo.isExternal) {
        const resolvedPath = resolveModulePath(
          importInfo.module,
          filename,
          files
        );

        if (resolvedPath && exports[resolvedPath]) {
          // Проверяем что импортируемые элементы существуют
          const availableExports = exports[resolvedPath];
          const resolvedImports = [];

          if (importInfo.defaultImport && availableExports.default) {
            resolvedImports.push({
              name: importInfo.defaultImport,
              type: "default",
              from: resolvedPath,
            });
          }

          importInfo.namedImports.forEach((namedImport) => {
            const importName = namedImport.name || namedImport;
            if (availableExports.named[importName]) {
              resolvedImports.push({
                name: importName,
                type: "named",
                from: resolvedPath,
                definition: availableExports.named[importName],
              });
            }
          });

          graph[filename].imports.push({
            module: importInfo.module,
            resolvedPath,
            imports: resolvedImports,
          });

          graph[filename].dependsOn.push(resolvedPath);

          if (!graph[resolvedPath].dependents.includes(filename)) {
            graph[resolvedPath].dependents.push(filename);
          }
        }
      }
    });
  });

  return graph;
}

/**
 * Создает унифицированный контекст из всех файлов
 * @param {Object} files - все файлы проекта
 * @param {Object} filesMetadata - метаданные всех файлов
 * @returns {Object} унифицированный контекст
 */
function createUnifiedContext(files, filesMetadata) {
  const dependencyGraph = buildDependencyGraph(files, filesMetadata);

  const unifiedContext = {
    functions: {},
    variables: {},
    classes: {},
    interfaces: {},
    types: {},
    enums: {},
    imports: {},
    exports: {},
    files: filesMetadata,
    dependencies: dependencyGraph,
    globalDeclarations: {},
  };

  // Собираем глобальные декларации
  Object.entries(filesMetadata).forEach(([filename, metadata]) => {
    // Глобальные функции (declare function)
    if (metadata.functions) {
      Object.values(metadata.functions).forEach((func) => {
        if (func.isDeclared) {
          unifiedContext.globalDeclarations[func.name] = {
            ...func,
            from: filename,
          };
        }
      });
    }

    // Объединяем экспортируемые элементы в глобальный контекст
    const fileExports = extractExports(metadata);
    Object.entries(fileExports.named).forEach(([name, exportData]) => {
      const category = exportData.type || "unknown";
      if (!unifiedContext[category]) {
        unifiedContext[category] = {};
      }
      unifiedContext[category][name] = {
        ...exportData,
        from: filename,
      };
    });
  });

  return unifiedContext;
}

module.exports = {
  resolveModulePath,
  extractImports,
  extractExports,
  buildDependencyGraph,
  createUnifiedContext,
};
