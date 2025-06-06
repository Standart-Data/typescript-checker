const ts = require("typescript");
const { isExported } = require("./common-utils");

/**
 * Функция для более детального разбора содержимого модулей и неймспейсов
 * @param {ts.Node} node - нода модуля или неймспейса
 * @param {ts.TypeChecker} checker - средство проверки типов TypeScript
 * @param {Object} allVariables - объект для хранения найденных переменных и типов
 * @param {boolean} isDeclared - флаг, указывающий, имеет ли элемент модификатор declare
 * @param {Object} parsers - объект с парсерами для различных типов узлов
 */
function parseModuleContents(node, checker, allVariables, isDeclared, parsers) {
  const moduleName = node.name.getText().replace(/['"]+/g, "");
  const isGlobal = moduleName === "global";
  const moduleData = {
    exports: {},
    interfaces: {},
    functions: {},
    classes: {},
    variables: {},
    types: {},
    enums: {},
  };

  if (node.body && ts.isModuleBlock(node.body)) {
    node.body.statements.forEach((statement) => {
      // Проверяем экспорты модуля
      if (ts.isExportAssignment(statement)) {
        // export default ...
        if (statement.isExportEquals) {
          // export = ...
          moduleData.exports.exportEquals = statement.expression.getText();
        } else {
          // export default ...
          moduleData.exports.default = statement.expression.getText();
        }
      } else if (ts.isExportDeclaration(statement)) {
        // export { ... } from '...'
        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          if (!moduleData.exports.named) moduleData.exports.named = [];
          statement.exportClause.elements.forEach((specifier) => {
            moduleData.exports.named.push({
              name: specifier.name.text,
              alias: specifier.propertyName?.text,
            });
          });
        }
      }

      // Используем обновленные parseSimple... функции, передавая им moduleData и checker
      if (ts.isFunctionDeclaration(statement)) {
        parsers.parseSimpleFunctionDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true /*isModuleMember*/
        );
      } else if (ts.isInterfaceDeclaration(statement)) {
        parsers.parseSimpleInterfaceDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isClassDeclaration(statement)) {
        parsers.parseSimpleClassDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isVariableStatement(statement)) {
        parsers.parseSimpleVariableStatement(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isTypeAliasDeclaration(statement)) {
        parsers.parseSimpleTypeAliasDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isEnumDeclaration(statement)) {
        parsers.parseSimpleEnumDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      }
      // Добавить обработку других типов экспортируемых/объявленных сущностей, если нужно
    });
  }

  if (isGlobal) {
    // Для declare global объединяем с корневым allVariables
    Object.assign(
      allVariables.declarations,
      moduleData.functions,
      moduleData.interfaces,
      moduleData.classes,
      moduleData.variables,
      moduleData.types,
      moduleData.enums
    );
  } else {
    const target =
      node.flags & ts.NodeFlags.Namespace
        ? allVariables.namespaces
        : allVariables.modules;

    target[moduleName] = {
      ...moduleData,
      isDeclared,
      isExported: isExported(node, false /*isModuleMember*/),
    };
  }
}

module.exports = {
  parseModuleContents,
};
