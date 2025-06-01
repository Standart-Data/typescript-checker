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
 * Анализирует type assertion или satisfies оператор в React AST
 * @param {Object} initializer - инициализатор переменной
 * @returns {Object|null} информация о type assertion
 */
function analyzeTypeAssertionReact(initializer) {
  if (!initializer) return null;

  // Обработка type assertion (value as Type)
  if (initializer.type === "TSAsExpression") {
    const typeText = getNodeText(initializer.typeAnnotation);
    // Специальная проверка для as const
    if (typeText === "const") {
      return {
        operator: "as",
        type: "const",
        originalExpression: getNodeText(initializer.expression),
        fullExpression: getNodeText(initializer),
      };
    }

    return {
      operator: "as",
      type: initializer.typeAnnotation
        ? getTSType(initializer.typeAnnotation)
        : "unknown",
      originalExpression: getNodeText(initializer.expression),
      fullExpression: getNodeText(initializer),
    };
  }

  // Обработка type assertion angle bracket style (<Type>value)
  if (initializer.type === "TSTypeAssertion") {
    return {
      operator: "as",
      type: initializer.typeAnnotation
        ? getTSType(initializer.typeAnnotation)
        : "unknown",
      originalExpression: getNodeText(initializer.expression),
      fullExpression: getNodeText(initializer),
    };
  }

  // Обработка satisfies (value satisfies Type)
  if (initializer.type === "TSSatisfiesExpression") {
    return {
      operator: "satisfies",
      type: initializer.typeAnnotation
        ? getTSType(initializer.typeAnnotation)
        : "unknown",
      originalExpression: getNodeText(initializer.expression),
      fullExpression: getNodeText(initializer),
    };
  }

  return null;
}

/**
 * Получает текстовое представление узла AST
 * @param {Object} node - узел AST
 * @returns {string} текстовое представление
 */
function getNodeText(node) {
  if (!node) return "";

  // Простые литералы
  if (node.type === "StringLiteral") return `"${node.value}"`;
  if (node.type === "NumericLiteral") return node.value.toString();
  if (node.type === "BooleanLiteral") return node.value.toString();
  if (node.type === "Identifier") return node.name;

  // Для объектов и массивов возвращаем упрощенное представление
  if (node.type === "ObjectExpression") {
    const props = node.properties
      .map((prop) => {
        const key = prop.key ? prop.key.name || prop.key.value : "unknown";
        const val = prop.value ? getNodeText(prop.value) : "unknown";
        return `${key}: ${val}`;
      })
      .join(", ");
    return `{ ${props} }`;
  }

  if (node.type === "ArrayExpression") {
    const elements = node.elements.map((el) => getNodeText(el)).join(", ");
    return `[${elements}]`;
  }

  // Для типов
  if (node.type === "TSStringKeyword") return "string";
  if (node.type === "TSNumberKeyword") return "number";
  if (node.type === "TSBooleanKeyword") return "boolean";
  if (node.type === "TSAnyKeyword") return "any";

  // Обработка readonly типов
  if (node.type === "TSTypeOperator" && node.operator === "readonly") {
    const innerType = getNodeText(node.typeAnnotation);
    return `readonly ${innerType}`;
  }

  // Обработка массивов типов
  if (node.type === "TSArrayType") {
    const elementType = getNodeText(node.elementType);
    return `${elementType}[]`;
  }

  if (node.type === "TSTypeReference" && node.typeName) {
    // Специальная обработка для const
    if (node.typeName.type === "Identifier" && node.typeName.name === "const") {
      return "const";
    }
    return node.typeName.name || "unknown";
  }

  // TSAsExpression - для правильного отображения полного выражения
  if (node.type === "TSAsExpression") {
    const expr = getNodeText(node.expression);
    const type = getNodeText(node.typeAnnotation);
    return `${expr} as ${type}`;
  }

  // Fallback - пытаемся использовать raw или value если доступны
  return node.raw || node.value || node.name || "unknown";
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

  // Анализируем type assertion
  const typeAssertion = analyzeTypeAssertionReact(node.init);

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
    typeAssertion: typeAssertion, // Новое поле для type assertion
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
