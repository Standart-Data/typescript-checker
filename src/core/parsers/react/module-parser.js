const t = require("@babel/types");

/**
 * Парсит содержимое модуля для React/Babel AST
 * @param {Object} path - путь к узлу TSModuleDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isDeclared - флаг declare
 * @param {Object} parsers - объект с парсерами для различных типов узлов
 */
function parseModuleContents(path, context, isDeclared, parsers) {
  const node = path.node;

  if (!node.id) {
    return;
  }

  let moduleName;
  if (node.id.type === "Identifier") {
    moduleName = node.id.name;
  } else if (node.id.type === "StringLiteral") {
    moduleName = node.id.value;
  } else {
    moduleName = "unknown";
  }

  // Определяем тип модуля
  const isNamespace = node.declare && !t.isStringLiteral(node.id);
  const isDeclareModule = node.declare && t.isStringLiteral(node.id);

  // Создаем контекст для содержимого модуля
  const moduleContext = {
    functions: {},
    variables: {},
    classes: {},
    interfaces: {},
    types: {},
    enums: {},
    imports: {},
    exports: {},
    declarations: {},
    modules: {},
    namespaces: {},
  };

  // Парсим содержимое модуля
  if (node.body) {
    if (node.body.type === "TSModuleBlock" && node.body.body) {
      // Обычный блок модуля
      node.body.body.forEach((statement) => {
        const statementPath = {
          node: statement,
          parent: node,
        };

        parseModuleStatement(statementPath, moduleContext, isDeclared, parsers);
      });
    } else {
      // Вложенный модуль
      const nestedPath = {
        node: node.body,
        parent: node,
      };
      parseModuleContents(nestedPath, moduleContext, isDeclared, parsers);
    }
  }

  // Сохраняем результат в зависимости от типа модуля
  if (isNamespace) {
    context.namespaces[moduleName] = {
      name: moduleName,
      ...moduleContext,
      isDeclared,
    };
  } else if (isDeclareModule) {
    context.modules[moduleName] = {
      name: moduleName,
      ...moduleContext,
      isDeclared,
    };
  } else {
    // Обычный namespace
    context.namespaces[moduleName] = {
      name: moduleName,
      ...moduleContext,
      isDeclared,
    };
  }
}

/**
 * Парсит отдельный statement внутри модуля
 * @param {Object} path - путь к statement
 * @param {Object} context - контекст модуля
 * @param {boolean} isDeclared - флаг declare
 * @param {Object} parsers - объект с парсерами
 */
function parseModuleStatement(path, context, isDeclared, parsers) {
  const node = path.node;

  switch (node.type) {
    case "FunctionDeclaration":
      if (parsers.parseSimpleFunctionDeclaration) {
        parsers.parseSimpleFunctionDeclaration(path, context, isDeclared, true);
      }
      break;
    case "VariableDeclaration":
      // Обрабатываем каждую декларацию переменной отдельно
      if (node.declarations && parsers.parseSimpleVariableStatement) {
        node.declarations.forEach((declaration) => {
          const declarationPath = {
            node: declaration,
            parent: node,
          };
          parsers.parseSimpleVariableStatement(
            declarationPath,
            context,
            isDeclared,
            true
          );
        });
      }
      break;
    case "ClassDeclaration":
      if (parsers.parseSimpleClassDeclaration) {
        parsers.parseSimpleClassDeclaration(path, context, isDeclared, true);
      }
      break;
    case "TSInterfaceDeclaration":
      if (parsers.parseSimpleInterfaceDeclaration) {
        parsers.parseSimpleInterfaceDeclaration(
          path,
          context,
          isDeclared,
          true
        );
      }
      break;
    case "TSTypeAliasDeclaration":
      if (parsers.parseSimpleTypeAliasDeclaration) {
        parsers.parseSimpleTypeAliasDeclaration(
          path,
          context,
          isDeclared,
          true
        );
      }
      break;
    case "TSEnumDeclaration":
      if (parsers.parseSimpleEnumDeclaration) {
        parsers.parseSimpleEnumDeclaration(path, context, isDeclared, true);
      }
      break;
    case "TSModuleDeclaration":
      // Вложенный модуль
      parseModuleContents(path, context, isDeclared, parsers);
      break;
    case "ExportNamedDeclaration":
    case "ExportDefaultDeclaration":
    case "ExportAllDeclaration":
      if (parsers.parseSimpleExportDeclaration) {
        parsers.parseSimpleExportDeclaration(path, context);
      }
      break;
    case "ImportDeclaration":
      if (parsers.parseSimpleImportDeclaration) {
        parsers.parseSimpleImportDeclaration(path, context);
      }
      break;
  }
}

module.exports = {
  parseModuleContents,
};
