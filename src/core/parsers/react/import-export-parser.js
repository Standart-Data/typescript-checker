const t = require("@babel/types");

/**
 * Парсит объявление импорта в React/Babel AST
 * @param {Object} path - путь к узлу ImportDeclaration
 * @param {Object} context - контекст для сохранения результатов
 */
function parseSimpleImportDeclaration(path, context) {
  const node = path.node;

  if (!node.source || !t.isStringLiteral(node.source)) {
    return;
  }

  const modulePath = node.source.value;
  const imports = [];
  let defaultImport = null;
  let namedImports = [];

  if (node.specifiers && node.specifiers.length > 0) {
    node.specifiers.forEach((specifier) => {
      if (specifier.type === "ImportDefaultSpecifier") {
        // import DefaultName from "module"
        defaultImport = specifier.local.name;
        imports.push({
          name: specifier.local.name,
          importedName: "default",
          isDefault: true,
          isNamespace: false,
        });
      } else if (specifier.type === "ImportSpecifier") {
        // import { SpecificName } from "module" или import { Original as Alias } from "module"
        const namedImport = {
          name: specifier.local.name,
          alias:
            specifier.local.name !==
            (specifier.imported.name || specifier.imported.value)
              ? specifier.imported.name || specifier.imported.value
              : null,
        };
        namedImports.push(namedImport);

        imports.push({
          name: specifier.local.name,
          importedName: specifier.imported.name || specifier.imported.value,
          isDefault: false,
          isNamespace: false,
          alias:
            specifier.local.name !==
            (specifier.imported.name || specifier.imported.value)
              ? specifier.local.name
              : undefined,
        });
      } else if (specifier.type === "ImportNamespaceSpecifier") {
        // import * as Namespace from "module"
        imports.push({
          name: specifier.local.name,
          importedName: "*",
          isDefault: false,
          isNamespace: true,
        });
      }
    });
  } else {
    // import "module" (side-effect import)
    imports.push({
      name: null,
      importedName: null,
      isDefault: false,
      isNamespace: false,
      isSideEffect: true,
    });
  }

  // Создаем структуру совместимую с TypeScript парсером
  context.imports[modulePath] = {
    module: modulePath,
    defaultImport: defaultImport,
    namedImports: namedImports,
    // Сохраняем старую структуру для обратной совместимости
    modulePath: modulePath,
    imports: imports,
    ...Object.fromEntries(
      imports.map((imp) => [imp.name || imp.importedName, imp])
    ),
  };
}

/**
 * Парсит объявление экспорта в React/Babel AST
 * @param {Object} path - путь к узлу ExportDeclaration
 * @param {Object} context - контекст для сохранения результатов
 */
function parseSimpleExportDeclaration(path, context) {
  const node = path.node;

  if (node.type === "ExportNamedDeclaration") {
    if (node.source && t.isStringLiteral(node.source)) {
      // export { name } from "module" - реэкспорт
      const modulePath = node.source.value;

      if (node.specifiers && node.specifiers.length > 0) {
        node.specifiers.forEach((specifier) => {
          if (specifier.type === "ExportSpecifier") {
            const exportedName =
              specifier.exported.name || specifier.exported.value;
            const localName = specifier.local.name || specifier.local.value;

            // Добавляем экспорт в корневой объект
            context.exports[exportedName] = true;
          }
        });
      }
    } else if (node.declaration) {
      // export const/function/class/interface/type/enum
      // Эти декларации будут обработаны соответствующими парсерами с флагом isExported
      // Но мы также можем напрямую добавить их в exports для совместимости
      if (node.declaration.id && node.declaration.id.name) {
        context.exports[node.declaration.id.name] = true;
      } else if (node.declaration.declarations) {
        // export const a = 1, b = 2;
        node.declaration.declarations.forEach((decl) => {
          if (decl.id && decl.id.name) {
            context.exports[decl.id.name] = true;
          }
        });
      }
    } else if (node.specifiers) {
      // export { name1, name2 }
      node.specifiers.forEach((specifier) => {
        if (specifier.type === "ExportSpecifier") {
          const exportedName =
            specifier.exported.name || specifier.exported.value;
          context.exports[exportedName] = true;
        }
      });
    }
  } else if (node.type === "ExportDefaultDeclaration") {
    // export default ...
    let localName = "default";

    if (node.declaration) {
      if (node.declaration.type === "Identifier") {
        // export default existingVariable
        localName = node.declaration.name;
        context.exports[localName] = true;
      } else if (node.declaration.id) {
        // export default function/class with name
        localName = node.declaration.id.name;
        context.exports[localName] = true;
      }
    }

    context.exports.default = localName;
  } else if (node.type === "ExportAllDeclaration") {
    // export * from "module"
    if (node.source && t.isStringLiteral(node.source)) {
      const modulePath = node.source.value;
      if (!context.exports[modulePath]) {
        context.exports[modulePath] = [];
      }
      context.exports[modulePath].push({
        name: "*",
        localName: "*",
        isDefault: false,
        isNamespaceExport: true,
      });
    }
  }
}

module.exports = {
  parseSimpleImportDeclaration,
  parseSimpleExportDeclaration,
};
