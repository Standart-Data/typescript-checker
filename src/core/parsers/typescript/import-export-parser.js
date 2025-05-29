const ts = require("typescript");

/**
 * Парсит объявление импорта
 * @param {ts.ImportDeclaration} node - нода импорта
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 */
function parseSimpleImportDeclaration(node, context, checker) {
  if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    const moduleName = node.moduleSpecifier.text;
    if (!context.imports[moduleName]) {
      context.imports[moduleName] = {
        module: moduleName,
        defaultImport: null,
        namedImports: [],
      };
    }

    if (node.importClause) {
      if (node.importClause.name) {
        // Default import: import D from 'module'
        context.imports[moduleName].defaultImport = node.importClause.name.text;
      }
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Namespace import: import * as N from 'module'
          // Можно добавить специальную обработку для NamespaceImport, если нужно
          // context.imports[moduleName].namespaceImport = node.importClause.namedBindings.name.text;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Named imports: import { A, B as C } from 'module'
          node.importClause.namedBindings.elements.forEach((element) => {
            context.imports[moduleName].namedImports.push({
              name: element.name.text,
              alias: element.propertyName?.text,
            });
          });
        }
      }
    }
  }
}

/**
 * Парсит объявление экспорта
 * @param {ts.ExportDeclaration} node - нода экспорта
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 */
function parseSimpleExportDeclaration(node, context, checker) {
  if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    node.exportClause.elements.forEach((specifier) => {
      const name = specifier.name.text;
      const alias = specifier.propertyName?.text;
      if (!context.exports.namedExports) context.exports.namedExports = [];
      context.exports.namedExports.push({
        name,
        alias,
        from: node.moduleSpecifier?.text,
      });
    });
  } else if (node.moduleSpecifier) {
    // export * from 'module'
    if (!context.exports.reExports) context.exports.reExports = [];
    context.exports.reExports.push({ module: node.moduleSpecifier.text });
  }
  // export default ... handled by specific declaration nodes (FunctionDeclaration, ClassDeclaration, etc.) with ExportKeyword and DefaultKeyword
}

module.exports = {
  parseSimpleImportDeclaration,
  parseSimpleExportDeclaration,
};
