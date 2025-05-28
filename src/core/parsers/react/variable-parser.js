const t = require("@babel/types");
const { getTSType, getType } = require("./types");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объектный литерал рекурсивно для React/Babel AST
 * @param {Object} objectNode - нода объекта
 * @returns {Object} - структурированный объект
 */
function parseObjectLiteral(objectNode) {
  const result = {};

  if (!objectNode || objectNode.type !== "ObjectExpression") {
    return null;
  }

  objectNode.properties.forEach((property) => {
    if (property.type === "ObjectProperty" && property.key) {
      const propName = property.key.name || property.key.value;
      const propValue = property.value;

      let parsedValue;
      if (propValue.type === "ObjectExpression") {
        // Рекурсивно парсим вложенные объекты
        parsedValue = {
          type: "object",
          value: parseObjectLiteral(propValue),
        };
      } else if (propValue.type === "StringLiteral") {
        parsedValue = {
          type: "string",
          value: propValue.value,
        };
      } else if (propValue.type === "NumericLiteral") {
        parsedValue = {
          type: "number",
          value: propValue.value.toString(),
        };
      } else if (propValue.type === "BooleanLiteral") {
        parsedValue = {
          type: "boolean",
          value: propValue.value.toString(),
        };
      } else {
        // Для других типов сохраняем текстовое представление
        parsedValue = {
          type: "unknown",
          value: propValue.raw || propValue.toString(),
        };
      }

      result[propName] = parsedValue;
    }
  });

  return result;
}

/**
 * Парсит объявление переменной в React/Babel AST
 * @param {Object} path - путь к узлу VariableDeclarator
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleVariableStatement(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const varName = node.id.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  // Получаем тип переменной
  let varType = "unknown";
  if (node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
    varType = getTSType(node.id.typeAnnotation.typeAnnotation);
  } else if (node.init) {
    varType = getType(node.init);
  }

  // Определяем значение переменной
  let parsedValue = "";
  if (node.init) {
    if (node.init.type === "ObjectExpression") {
      // Парсим объектный литерал
      parsedValue = parseObjectLiteral(node.init);
    } else if (t.isStringLiteral(node.init)) {
      parsedValue = `"${node.init.value}"`;
    } else if (t.isNumericLiteral(node.init)) {
      parsedValue = node.init.value.toString();
    } else if (t.isBooleanLiteral(node.init)) {
      parsedValue = node.init.value.toString();
    } else {
      // Для не-объектов используем текстовое представление
      parsedValue = node.init.toString();
    }
  }

  // Определяем тип декларации (const, let, var)
  const declarationType = path.parent.kind || "var";

  context.variables[varName] = {
    name: varName,
    type: varType,
    isConst: declarationType === "const",
    declarationType: declarationType,
    hasInitializer: !!node.init,
    initializerValue: node.init ? node.init.toString() : undefined,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для обратной совместимости со старыми тестами
    types: [varType], // старые тесты ожидают массив типов
    value: parsedValue, // теперь может быть объектом или строкой
  };
}

module.exports = {
  parseSimpleVariableStatement,
  parseObjectLiteral,
};
