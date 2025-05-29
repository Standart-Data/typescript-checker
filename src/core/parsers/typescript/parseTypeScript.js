const ts = require("typescript");
const fs = require("fs");
const path = require("path");

// Импортируем новые модули
const { parseDecorators } = require("./decorators");
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
const { normalizeLineEndings, getVariableType } = require("./utils");

/**
 * Парсит TypeScript/JavaScript файлы и извлекает метаданные.
 * Использует TypeChecker для более точного анализа типов.
 * @param {string[]} filePaths - Массив путей к файлам для парсинга.
 * @returns {Object} - Объект с метаданными.
 */
function parseTypeScript(filePaths) {
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
  };

  // Пытаемся найти и загрузить tsconfig.json, если он есть
  let compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext, // или CommonJS, в зависимости от проекта
    jsx: ts.JsxEmit.React, // или Preserve, если JSX обрабатывается Babel
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  };
  if (filePaths.length > 0) {
    // Попытка найти tsconfig.json относительно первого файла или в корне проекта (если возможно)
    // Это упрощенная логика, в реальном проекте может потребоваться более сложный поиск tsconfig
    const probableTsConfigPath = ts.findConfigFile(
      path.dirname(filePaths[0]),
      ts.sys.fileExists
    );
    if (probableTsConfigPath) {
      const configFile = ts.readConfigFile(
        probableTsConfigPath,
        ts.sys.readFile
      );
      const parsedCmd = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(probableTsConfigPath)
      );
      if (parsedCmd.options) {
        compilerOptions = { ...compilerOptions, ...parsedCmd.options };
      }
    }
  }

  const program = ts.createProgram(filePaths, compilerOptions);
  const checker = program.getTypeChecker();

  // Создаем объект с парсерами для передачи в parseModuleContents
  const parsers = {
    parseSimpleFunctionDeclaration,
    parseSimpleVariableStatement,
    parseSimpleClassDeclaration,
    parseSimpleInterfaceDeclaration,
    parseSimpleTypeAliasDeclaration,
    parseSimpleEnumDeclaration,
  };

  filePaths.forEach((filePath) => {
    const sourceFile = program.getSourceFile(filePath);
    if (sourceFile) {
      function visit(node) {
        const isDeclared =
          node.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
          ) || false;

        switch (node.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            parseSimpleFunctionDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.VariableStatement:
            parseSimpleVariableStatement(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.ClassDeclaration:
            parseSimpleClassDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.InterfaceDeclaration:
            parseSimpleInterfaceDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.TypeAliasDeclaration:
            parseSimpleTypeAliasDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.EnumDeclaration:
            parseSimpleEnumDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.ImportDeclaration:
            parseSimpleImportDeclaration(node, result, checker);
            break;
          case ts.SyntaxKind.ExportDeclaration:
          case ts.SyntaxKind.ExportAssignment: // export default ...
            // ExportAssignment (export default x;) будет обработан через Variable, Function, Class с ExportDefault флагом.
            // ExportDeclaration (export {x} or export * from '...'),
            parseSimpleExportDeclaration(node, result, checker);
            break;
          case ts.SyntaxKind.ModuleDeclaration: // declare module "..." or namespace X {}
            parseModuleContents(node, checker, result, isDeclared, parsers);
            break;
          case ts.SyntaxKind.ExpressionStatement:
            // Обрабатываем assignment expressions для добавления свойств к функциям
            parseExpressionStatement(node, result, checker);
            break;
          // Другие типы узлов AST, если необходимо
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);
    }
  });

  return result;
}

/**
 * Парсит expression statement для обработки assignment expressions
 * @param {ts.ExpressionStatement} node - нода expression statement
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 */
function parseExpressionStatement(node, context, checker) {
  if (node.expression && ts.isBinaryExpression(node.expression)) {
    const expr = node.expression;

    // Проверяем, что это assignment (=)
    if (expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const left = expr.left;
      const right = expr.right;

      // Проверяем, что левая часть это property access (someFunc.defaultName)
      if (ts.isPropertyAccessExpression(left)) {
        const objectName = left.expression.getText();
        const propertyName = left.name.text;

        // Проверяем, есть ли объект в functions
        if (context.functions[objectName]) {
          let rightValue = right.getText();
          const rightType = checker.typeToString(
            checker.getTypeAtLocation(right)
          );

          // Убираем лишние кавычки для строковых литералов
          if (ts.isStringLiteral(right)) {
            rightValue = right.text; // используем text вместо getText() для строк
          }

          // Добавляем свойство к функции
          context.functions[objectName][propertyName] = {
            value: rightValue,
            types: [rightType],
          };
        }
      }
    }
  }
}

module.exports = {
  parseTypeScript,
};
