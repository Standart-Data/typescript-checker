const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const babel = require("@babel/core");

/**
 * Определяет расширение файла с учетом .d.ts (локальная копия)
 * @param {string} filename - имя файла
 * @returns {string} расширение файла
 */
function getFileExtension(filename) {
  if (filename.endsWith(".d.ts")) {
    return "d.ts";
  }
  return filename.split(".").pop().toLowerCase();
}

/**
 * Создает временную директорию со всеми файлами проекта
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} информация о временной директории
 */
function createTempProject(files) {
  const tempDir = tmp.dirSync({ unsafeCleanup: true });
  const fileMap = {};

  // Создаем глобальные типы из всех .d.ts файлов
  let globalTypes = "";
  const globalDeclarations = [];

  Object.entries(files).forEach(([filename, content]) => {
    const extension = getFileExtension(filename);
    if (extension === "d.ts") {
      // Извлекаем глобальные декларации из .d.ts файлов
      const globalMatch = content.match(/declare global\s*\{([^}]+)\}/s);
      if (globalMatch) {
        globalDeclarations.push(globalMatch[1].trim());
      }
    }
  });

  // Создаем единый файл глобальных типов
  if (globalDeclarations.length > 0) {
    globalTypes = `declare global {\n  ${globalDeclarations.join(
      "\n  "
    )}\n}\n\nexport {};`;
    const globalTypesPath = path.join(tempDir.name, "global.d.ts");
    fs.writeFileSync(globalTypesPath, globalTypes);
    fileMap["global.d.ts"] = globalTypesPath;
  }

  Object.entries(files).forEach(([filename, content]) => {
    const fullPath = path.join(tempDir.name, filename);
    const dir = path.dirname(fullPath);

    // Создаем директории если нужно
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    fileMap[filename] = fullPath;
  });

  return {
    tempDir,
    fileMap,
    cleanup: () => tempDir.removeCallback(),
  };
}

/**
 * Валидирует все TypeScript файлы в проекте одновременно
 * @param {Object} tsFiles - объект с TypeScript файлами {filename: content}
 * @param {Object} tempProject - информация о временном проекте
 * @returns {Object} результат валидации по файлам
 */
function validateAllTypeScriptInProject(tsFiles, tempProject) {
  try {
    const compilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      baseUrl: tempProject.tempDir.name,
      rootDir: tempProject.tempDir.name,
      typeRoots: [tempProject.tempDir.name],
      allowImportingTsExtensions: false,
      noEmit: true,
      resolveJsonModule: true,
      isolatedModules: false,
      allowJs: true,
      checkJs: false,
      moduleDetection: ts.ModuleDetectionKind.Auto,
      types: [],
      skipDefaultLibCheck: true,
    };

    // Получаем все файлы проекта, включая созданный глобальный файл типов
    const allFiles = Object.values(tempProject.fileMap);

    const program = ts.createProgram(allFiles, compilerOptions);

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
    const extension = getFileExtension(filename);
    const isJSX = extension === "tsx";
    const isDeclaration = extension === "d.ts";

    const compilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      declaration: isDeclaration,
      baseUrl: tempProject.tempDir.name,
      rootDir: tempProject.tempDir.name,
      typeRoots: [tempProject.tempDir.name],
      allowImportingTsExtensions: false,
      noEmit: true,
      resolveJsonModule: true,
      isolatedModules: false,
      allowJs: true,
      checkJs: false,
      moduleDetection: ts.ModuleDetectionKind.Auto,
      types: [],
      skipDefaultLibCheck: true,
    };

    // Получаем все файлы проекта, включая созданный глобальный файл типов
    const allFiles = Object.values(tempProject.fileMap);

    const program = ts.createProgram(allFiles, compilerOptions);
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

/**
 * Валидирует Babel файл (jsx/tsx/ts) в контексте проекта
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @returns {Array} массив ошибок
 */
function validateBabelInProject(filename, content, tempProject) {
  try {
    const extension = getFileExtension(filename);
    const isTypeScript = extension === "tsx" || extension === "ts";
    const isJSX = extension === "tsx" || extension === "jsx";

    const babelOptions = {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ...(isJSX ? [["@babel/preset-react", { runtime: "automatic" }]] : []),
      ],
      plugins: [],
      filename: path.join(tempProject.tempDir.name, filename),
      parserOpts: {
        sourceType: "module",
        allowImportExportEverywhere: true,
        plugins: [
          ...(isJSX ? ["jsx"] : []),
          ...(isTypeScript ? ["typescript"] : []),
        ],
      },
    };

    if (isTypeScript) {
      babelOptions.presets.push([
        "@babel/preset-typescript",
        {
          isTSX: isJSX,
          allExtensions: true,
        },
      ]);
    }

    // Пытаемся распарсить код
    babel.parse(content, babelOptions);

    return [];
  } catch (error) {
    const errorInfo = {
      message: error.message,
    };

    if (error.loc) {
      errorInfo.location = {
        line: error.loc.line,
        column: error.loc.column + 1,
      };
    }

    return [errorInfo];
  }
}

/**
 * Обрабатывает один файл в контексте множественных файлов
 * @param {string} filename - имя файла
 * @param {string} content - содержимое файла
 * @param {Object} tempProject - информация о временном проекте
 * @param {boolean} forceUseBabel - принудительно использовать Babel для всех файлов
 * @returns {Object} результат обработки
 */
function processFileInProject(
  filename,
  content,
  tempProject,
  forceUseBabel = false
) {
  const extension = getFileExtension(filename);

  // Определяем какой процессор использовать
  const shouldUseBabel =
    forceUseBabel || extension === "jsx" || extension === "tsx";

  try {
    // Валидация
    let errors = [];
    if (shouldUseBabel && extension !== "d.ts") {
      // Для смешанных проектов используем Babel валидацию для всех файлов кроме .d.ts
      errors = validateBabelInProject(filename, content, tempProject);

      // Дополнительно для .ts файлов запускаем TypeScript валидацию для полной проверки ошибок
      if (extension === "ts") {
        const tsErrors = validateTypeScriptInProject(
          filename,
          content,
          tempProject
        );
        // Объединяем ошибки, исключая дублирующиеся
        const combinedErrors = [...errors];
        tsErrors.forEach((tsError) => {
          const isDuplicate = errors.some(
            (babelError) =>
              babelError.message === tsError.message &&
              babelError.location?.line === tsError.location?.line &&
              babelError.location?.column === tsError.location?.column
          );
          if (!isDuplicate) {
            combinedErrors.push(tsError);
          }
        });
        errors = combinedErrors;
      }
    } else {
      // TypeScript валидация для .d.ts или когда нет jsx файлов в проекте
      errors = validateTypeScriptInProject(filename, content, tempProject);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        compiledCode: null,
        outputFileName: null,
      };
    }

    // Компиляция
    let compiledCode = "";
    let outputFileName = filename;

    if (extension === "d.ts") {
      compiledCode = content; // .d.ts файлы не компилируются
    } else if (shouldUseBabel) {
      // Babel компиляция для всех файлов кроме .d.ts
      const isTypeScript = extension === "tsx" || extension === "ts";
      const isJSX = extension === "tsx" || extension === "jsx";

      const babelOptions = {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: false,
            },
          ],
          ...(isJSX
            ? [
                [
                  "@babel/preset-react",
                  {
                    runtime: "automatic",
                    importSource: "react",
                  },
                ],
              ]
            : []),
        ],
        plugins: [],
        filename: path.join(tempProject.tempDir.name, filename),
        parserOpts: {
          sourceType: "module",
          allowImportExportEverywhere: true,
          plugins: [
            ...(isJSX ? ["jsx"] : []),
            ...(isTypeScript ? ["typescript"] : []),
          ],
        },
      };

      if (isTypeScript) {
        babelOptions.presets.push([
          "@babel/preset-typescript",
          {
            isTSX: isJSX,
            allExtensions: true,
          },
        ]);
      }

      const result = babel.transformSync(content, babelOptions);
      compiledCode = result.code || "";
      outputFileName = filename.replace(/\.(tsx|jsx|ts)$/, ".js");
    } else {
      // TypeScript компиляция (только для проектов без jsx)
      const transpileResult = ts.transpileModule(content, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          isolatedModules: true,
          allowJs: true,
        },
      });
      compiledCode = transpileResult.outputText;
      outputFileName = filename.replace(/\.ts$/, ".js");
    }

    return {
      success: true,
      errors: [],
      compiledCode,
      outputFileName,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        { message: `Ошибка обработки файла ${filename}: ${error.message}` },
      ],
      compiledCode: null,
      outputFileName: null,
    };
  }
}

/**
 * Обрабатывает множество файлов с правильным разрешением зависимостей
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} результат обработки всех файлов
 */
function processMultipleFiles(files) {
  // Разделяем файлы на TypeScript/JavaScript и CSS
  const tsFiles = {};
  const cssFiles = {};

  Object.entries(files).forEach(([filename, content]) => {
    const extension = getFileExtension(filename);
    if (["css", "scss", "sass"].includes(extension)) {
      cssFiles[filename] = content;
    } else {
      tsFiles[filename] = content;
    }
  });

  const results = {
    compiledFiles: {},
    allErrors: [],
    processedFiles: {},
  };

  // Обрабатываем CSS файлы отдельно
  Object.entries(cssFiles).forEach(([filename, content]) => {
    results.processedFiles[filename] = {
      success: true,
      errors: [],
      compiledCode: content, // CSS возвращаем как есть
      outputFileName: filename,
    };
    results.compiledFiles[filename] = content;
  });

  // Если есть TypeScript/JavaScript файлы, обрабатываем их
  if (Object.keys(tsFiles).length > 0) {
    const tempProject = createTempProject(tsFiles);

    try {
      // Определяем, есть ли в проекте jsx/tsx файлы
      const hasJsxFiles = Object.keys(tsFiles).some((filename) => {
        const extension = getFileExtension(filename);
        return extension === "jsx" || extension === "tsx";
      });

      // Если есть jsx файлы, сначала выполняем общую TypeScript валидацию для всех .ts файлов
      let allTsErrors = {};
      if (hasJsxFiles) {
        // Получаем только .ts файлы (не .tsx)
        const pureTsFiles = {};
        Object.entries(tsFiles).forEach(([filename, content]) => {
          const extension = getFileExtension(filename);
          if (extension === "ts" || extension === "d.ts") {
            pureTsFiles[filename] = content;
          }
        });

        if (Object.keys(pureTsFiles).length > 0) {
          allTsErrors = validateAllTypeScriptInProject(
            pureTsFiles,
            tempProject
          );
        }
      }

      for (const [filename, content] of Object.entries(tsFiles)) {
        const extension = getFileExtension(filename);

        // Если в проекте есть jsx файлы, используем Babel для всех файлов
        const result = processFileInProject(
          filename,
          content,
          tempProject,
          hasJsxFiles
        );

        // Если у нас есть дополнительные TypeScript ошибки для этого файла, добавляем их
        if (hasJsxFiles && extension === "ts" && allTsErrors[filename]) {
          const additionalTsErrors = allTsErrors[filename];
          const combinedErrors = [...result.errors];

          additionalTsErrors.forEach((tsError) => {
            const isDuplicate = result.errors.some(
              (existingError) =>
                existingError.message === tsError.message &&
                existingError.location?.line === tsError.location?.line &&
                existingError.location?.column === tsError.location?.column
            );
            if (!isDuplicate) {
              combinedErrors.push(tsError);
            }
          });

          // Обновляем результат с дополнительными ошибками
          if (combinedErrors.length > result.errors.length) {
            result.errors = combinedErrors;
            if (result.success && combinedErrors.length > 0) {
              result.success = false;
              result.compiledCode = null;
            }
          }
        }

        results.processedFiles[filename] = result;
        results.allErrors.push(...result.errors);

        if (result.success && result.compiledCode) {
          results.compiledFiles[result.outputFileName] = result.compiledCode;
        }
      }
    } finally {
      tempProject.cleanup();
    }
  }

  return results;
}

module.exports = {
  createTempProject,
  validateAllTypeScriptInProject,
  validateTypeScriptInProject,
  validateBabelInProject,
  processFileInProject,
  processMultipleFiles,
};
