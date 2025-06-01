const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const ts = require("typescript");

// Импортируем новые модули
const { parseSimpleFunctionDeclaration } = require("./function-parser");
const { parseSimpleVariableStatement } = require("./variable-parser");
const { parseSimpleClassDeclaration } = require("./class-parser");
const { parseSimpleInterfaceDeclaration } = require("./interface-parser");
const { parseSimpleTypeAliasDeclaration } = require("./type-parser");
const { parseSimpleEnumDeclaration } = require("./enum-parser");
const {
  parseSimpleImportDeclaration,
  parseSimpleExportDeclaration,
} = require("./import-export-parser");
const { parseModuleContents } = require("./module-parser");
const { normalizeLineEndings } = require("./utils");

// Сохраняем специфичную для React логику
const {
  isArrowFunctionComponent,
  isFunctionComponent,
  isFunctionDeclarationComponent,
  isReactClassComponent,
} = require("./detectors");

const {
  processFunctionalComponent,
  processClassComponent,
  processFunctionDeclarationComponent,
} = require("./processors");

const { isHookCall, processHook } = require("./hooks");

/**
 * Извлекает информацию о перегрузках функций через TypeScript API
 * @param {string} filePath - путь к файлу
 * @param {string} code - исходный код
 * @returns {Object} объект с информацией о перегрузках
 */
function extractFunctionOverloads(filePath, code) {
  const overloads = {};

  try {
    // Создаем TypeScript program для анализа перегрузок
    const compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      allowJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    };

    // Создаем программу без системы файлов
    const program = ts.createProgram([filePath], compilerOptions, {
      getSourceFile: (fileName) => {
        if (fileName === filePath) {
          return ts.createSourceFile(
            fileName,
            code,
            ts.ScriptTarget.ESNext,
            true
          );
        }
        return undefined;
      },
      writeFile: () => {},
      getCurrentDirectory: () => "",
      getDirectories: () => [],
      fileExists: (fileName) => fileName === filePath,
      readFile: (fileName) => (fileName === filePath ? code : ""),
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      getDefaultLibFileName: () => "lib.d.ts",
    });

    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);

    if (!sourceFile) {
      return overloads;
    }

    function visit(node) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const functionName = node.name.text;

        if (!overloads[functionName]) {
          overloads[functionName] = [];
        }

        // Если это перегрузка (нет тела), добавляем её
        if (!node.body) {
          const signature = checker.getSignatureFromDeclaration(node);
          let returnType = "unknown";
          if (signature) {
            returnType = checker.typeToString(signature.getReturnType());
          }

          const parameters =
            node.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
              optional: !!param.questionToken,
              defaultValue: param.initializer?.getText() || null,
            })) || [];

          overloads[functionName].push({
            parameters,
            returnType,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  } catch (error) {
    // В случае ошибки просто не добавляем перегрузки
    console.warn(
      `Не удалось извлечь перегрузки из ${filePath}:`,
      error.message
    );
  }

  return overloads;
}

/**
 * Парсит React/TypeScript файлы и извлекает метаданные.
 * @param {string[]} filePaths - Массив путей к файлам для парсинга.
 * @returns {Object} - Объект с метаданными.
 */
function parseReact(filePaths) {
  const result = {
    functions: {},
    variables: {},
    classes: {},
    interfaces: {},
    types: {},
    enums: {},
    imports: {},
    exports: {},
    declarations: {}, // Для declare global и других глобальных объявлений
    modules: {}, // Для declare module "..."
    namespaces: {}, // Для declare namespace X {}
    // React-специфичные поля для обратной совместимости
    components: {},
    hooks: {},
  };

  // Создаем объект с парсерами для передачи в parseModuleContents
  const parsers = {
    parseSimpleFunctionDeclaration,
    parseSimpleVariableStatement,
    parseSimpleClassDeclaration,
    parseSimpleInterfaceDeclaration,
    parseSimpleTypeAliasDeclaration,
    parseSimpleEnumDeclaration,
    parseSimpleImportDeclaration,
    parseSimpleExportDeclaration,
  };

  filePaths.forEach((filePath) => {
    const code = fs.readFileSync(filePath, "utf8");
    const normalizedCode = normalizeLineEndings(code);

    // Извлекаем информацию о перегрузках через TypeScript API
    const functionOverloads = extractFunctionOverloads(
      filePath,
      normalizedCode
    );

    let ast;
    try {
      ast = parser.parse(normalizedCode, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          "jsx",
          "typescript",
          "decorators-legacy", // Babel 7 стабильная конфигурация
          "classProperties",
          "objectRestSpread",
          "functionBind",
          "exportDefaultFrom",
          "exportNamespaceFrom",
          "dynamicImport",
          "nullishCoalescingOperator",
          "optionalChaining",
          "optionalCatchBinding",
          "throwExpressions",
        ],
      });
    } catch (error) {
      console.error(`Ошибка парсинга файла ${filePath}:`, error.message);
      return;
    }

    traverse(ast, {
      // Переменные - основной обработчик переменных
      VariableDeclaration(path) {
        const isDeclared = path.node.declare || false;

        // Обрабатываем каждый декларатор в переменной
        path.node.declarations.forEach((declarator) => {
          const declaratorPath = {
            node: declarator,
            parent: path.node,
            get: path.get,
            scope: path.scope,
            parentPath: path,
          };

          // Проверяем, является ли это React компонентом
          if (
            isArrowFunctionComponent(declaratorPath) ||
            isFunctionComponent(declaratorPath)
          ) {
            processFunctionalComponent(declaratorPath, normalizedCode, result);
          } else {
            parseSimpleVariableStatement(declaratorPath, result, isDeclared);
          }

          // Проверяем на хуки
          if (isHookCall(declaratorPath)) {
            processHook(declaratorPath, normalizedCode, result);
          }
        });
      },

      // Функции
      FunctionDeclaration(path) {
        const isDeclared = path.node.declare || false;
        const funcName = path.node.id?.name;

        if (isFunctionDeclarationComponent(path)) {
          processFunctionDeclarationComponent(path, normalizedCode, result);
        } else {
          // Получаем перегрузки для этой функции, если они есть
          const overloads =
            funcName && functionOverloads[funcName]
              ? functionOverloads[funcName]
              : null;

          parseSimpleFunctionDeclaration(
            path,
            result,
            isDeclared,
            false,
            normalizedCode,
            overloads
          );
        }

        // Проверяем на хуки
        if (isHookCall(path)) {
          processHook(path, normalizedCode, result);
        }
      },

      // Классы
      ClassDeclaration(path) {
        const isDeclared = path.node.declare || false;

        if (isReactClassComponent(path)) {
          processClassComponent(path, normalizedCode, result);
        } else {
          parseSimpleClassDeclaration(path, result, isDeclared);
        }
      },

      // TypeScript конструкции
      TSInterfaceDeclaration(path) {
        const isDeclared = path.node.declare || false;
        parseSimpleInterfaceDeclaration(path, result, isDeclared);
      },

      TSTypeAliasDeclaration(path) {
        const isDeclared = path.node.declare || false;
        parseSimpleTypeAliasDeclaration(path, result, isDeclared);
      },

      TSEnumDeclaration(path) {
        const isDeclared = path.node.declare || false;
        parseSimpleEnumDeclaration(path, result, isDeclared);
      },

      TSModuleDeclaration(path) {
        const isDeclared = path.node.declare || false;
        parseModuleContents(path, result, isDeclared, parsers);
      },

      // Экспорты и импорты
      ExportNamedDeclaration(path) {
        parseSimpleExportDeclaration(path, result);
      },

      ExportDefaultDeclaration(path) {
        parseSimpleExportDeclaration(path, result);
      },

      ExportAllDeclaration(path) {
        parseSimpleExportDeclaration(path, result);
      },

      ImportDeclaration(path) {
        parseSimpleImportDeclaration(path, result);
      },

      // Вызовы функций для обнаружения хуков
      CallExpression(path) {
        if (isHookCall(path)) {
          processHook(path, normalizedCode, result);
        }
      },
    });
  });

  return result;
}

module.exports = {
  parseReact,
};
