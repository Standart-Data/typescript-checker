const ts = require("typescript");
const {
  getCommonModifiers,
  getDeclarationType,
  isConstVariable,
} = require("./common-utils");
const { getVariableType } = require("./utils");

/**
 * Парсит объектный литерал рекурсивно
 * @param {ts.ObjectLiteralExpression} objectNode - нода объекта
 * @param {ts.TypeChecker} checker - type checker
 * @returns {Object} - структурированный объект
 */
function parseObjectLiteral(objectNode, checker) {
  const result = {};

  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) {
    return null;
  }

  objectNode.properties.forEach((property) => {
    if (ts.isPropertyAssignment(property) && property.name) {
      const propName = property.name.getText();
      const propValue = property.initializer;

      let parsedValue;
      if (ts.isObjectLiteralExpression(propValue)) {
        // Рекурсивно парсим вложенные объекты
        parsedValue = {
          type: "object",
          value: parseObjectLiteral(propValue, checker),
        };
      } else if (ts.isStringLiteral(propValue)) {
        parsedValue = {
          type: "string",
          value: propValue.text,
        };
      } else if (ts.isNumericLiteral(propValue)) {
        parsedValue = {
          type: "number",
          value: propValue.text,
        };
      } else if (
        propValue.kind === ts.SyntaxKind.TrueKeyword ||
        propValue.kind === ts.SyntaxKind.FalseKeyword
      ) {
        parsedValue = {
          type: "boolean",
          value: propValue.getText(),
        };
      } else {
        // Для других типов сохраняем текстовое представление
        parsedValue = {
          type: "unknown",
          value: propValue.getText(),
        };
      }

      result[propName] = parsedValue;
    }
  });

  return result;
}

/**
 * Парсит объявление переменной
 * @param {ts.VariableStatement} node - нода переменной
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleVariableStatement(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  const modifiers = getCommonModifiers(node, isParentDeclared, isModuleMember);

  node.declarationList.declarations.forEach((declaration) => {
    if (declaration.name?.kind === ts.SyntaxKind.Identifier) {
      const varName = declaration.name.text;
      const varType = getVariableType(declaration, checker);

      // Определяем значение переменной
      let parsedValue = "";
      if (declaration.initializer) {
        if (ts.isObjectLiteralExpression(declaration.initializer)) {
          // Парсим объектный литерал
          parsedValue = parseObjectLiteral(declaration.initializer, checker);
        } else {
          // Для не-объектов используем старое поведение
          parsedValue = declaration.initializer.getText().replace(/['"]/g, "");
        }
      }

      context.variables[varName] = {
        name: varName,
        type: varType,
        isConst: isConstVariable(node),
        declarationType: getDeclarationType(node),
        hasInitializer: !!declaration.initializer,
        initializerValue: declaration.initializer?.getText(),
        isExported: modifiers.isExported,
        isDeclared: modifiers.isDeclared,
        // Поля для обратной совместимости со старыми тестами
        types: [varType], // старые тесты ожидают массив типов
        value: parsedValue, // теперь может быть объектом или строкой
        // TODO: decorators on variable/property might need special handling if they exist
      };
    }
  });
}

module.exports = {
  parseSimpleVariableStatement,
};
