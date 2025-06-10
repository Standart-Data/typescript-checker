const t = require("@babel/types");
const { getTSType, getType } = require("./types");
const { getCommonModifiers } = require("./common-utils");
const { analyzeJSX } = require("./jsx-analyzer");

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

  // Обработка вызовов функций
  if (node.type === "CallExpression") {
    const callee = getNodeText(node.callee);
    const args = node.arguments.map((arg) => getNodeText(arg)).join(", ");
    return `${callee}(${args})`;
  }

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

  // Обработка функциональных типов
  if (node.type === "TSFunctionType") {
    const params = node.parameters
      ? node.parameters
          .map((param) => {
            const paramName = param.name ? param.name : "";
            const paramType = param.typeAnnotation
              ? getNodeText(param.typeAnnotation.typeAnnotation)
              : "any";
            return `${paramName}: ${paramType}`;
          })
          .join(", ")
      : "";
    const returnType = node.typeAnnotation
      ? getNodeText(node.typeAnnotation.typeAnnotation)
      : "void";
    return `(${params}) => ${returnType}`;
  }

  // Обработка объектных типов (литералов)
  if (node.type === "TSTypeLiteral") {
    const members = node.members
      ? node.members
          .map((member) => {
            if (member.type === "TSPropertySignature") {
              const memberName = member.key ? member.key.name : "";
              const isOptional =
                member.optional || member.questionToken ? "?" : "";
              const memberType = member.typeAnnotation
                ? getNodeText(member.typeAnnotation.typeAnnotation)
                : "any";
              return `${memberName}${isOptional}: ${memberType}`;
            }
            return "";
          })
          .filter(Boolean)
          .join("; ")
      : "";
    return `{ ${members} }`;
  }

  if (node.type === "TSTypeReference" && node.typeName) {
    // Специальная обработка для const
    if (node.typeName.type === "Identifier" && node.typeName.name === "const") {
      return "const";
    }

    // Обработка generics (например, FunctionComponent<Props>)
    if (node.typeParameters && node.typeParameters.params) {
      const baseType = node.typeName.name || "unknown";
      const typeParams = node.typeParameters.params
        .map((param) => getNodeText(param))
        .join(", ");
      return `${baseType}<${typeParams}>`;
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
  let typeSignature = null; // Новое поле для полной сигнатуры типа

  if (node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
    varType = getTSType(node.id.typeAnnotation.typeAnnotation);
    typeSignature = getNodeText(node.id.typeAnnotation.typeAnnotation);
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
      // Для не-объектов используем getNodeText для правильного представления
      parsedValue = getNodeText(node.init);
    }
  }

  // Определяем тип декларации (const, let, var)
  const declarationType = path.parent.kind || "var";

  // Проверяем, является ли это функциональным компонентом
  const isFunctionComponent =
    node.init &&
    (node.init.type === "ArrowFunctionExpression" ||
      node.init.type === "FunctionExpression") &&
    typeSignature &&
    (typeSignature.includes("FunctionComponent") ||
      typeSignature.includes("FC"));

  const variableData = {
    name: varName,
    type: varType,
    typeSignature: typeSignature, // Добавляем typeSignature
    isConst: declarationType === "const",
    declarationType: declarationType,
    hasInitializer: !!node.init,
    initializerValue: node.init ? getNodeText(node.init) : undefined,
    typeAssertion: typeAssertion,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для обратной совместимости со старыми тестами
    types: [varType], // старые тесты ожидают массив типов
    value: parsedValue, // теперь может быть объектом или строкой
  };

  // Если это функциональный компонент, добавляем дополнительные поля и дублируем в functions
  if (isFunctionComponent) {
    // Извлекаем информацию о параметрах функции
    const functionParams = [];
    if (node.init.params) {
      node.init.params.forEach((param) => {
        if (param.type === "ObjectPattern") {
          // Деструктуризация параметров
          param.properties.forEach((prop) => {
            if (
              prop.type === "ObjectProperty" &&
              prop.key &&
              prop.key.type === "Identifier"
            ) {
              functionParams.push({
                name: prop.key.name,
                type: "any", // В деструктуризации тип обычно выводится
              });
            }
          });
        } else if (param.type === "Identifier") {
          functionParams.push({
            name: param.name,
            type: param.typeAnnotation
              ? getTSType(param.typeAnnotation.typeAnnotation)
              : "any",
          });
        }
      });
    }

    // Извлекаем JSX контент
    let jsxContent = "";
    let jsxAnalysis = null;
    if (node.init.body) {
      jsxContent = getNodeText(node.init.body);

      // Анализируем JSX структуру
      try {
        jsxAnalysis = analyzeJSX(node.init.body);
      } catch (error) {
        // Если анализ JSX не удался, просто продолжаем без него
        jsxAnalysis = null;
      }
    }

    variableData.jsx = true;
    variableData.params = functionParams;
    variableData.parameters = functionParams;
    variableData.returnType = "JSX.Element";
    variableData.returnResult = ["JSX.Element"];
    variableData.body = jsxContent;

    // Добавляем детальный анализ JSX
    if (jsxAnalysis) {
      variableData.jsxAnalysis = jsxAnalysis;
    }

    // Дублируем в functions для совместимости с тестами, которые ищут компоненты там
    context.functions[varName] = {
      name: varName,
      params: functionParams.map((p) => ({ ...p, type: [p.type] })), // Старый формат с type как массивом
      parameters: functionParams,
      returnType: "JSX.Element",
      returnResult: ["JSX.Element"],
      jsx: true,
      body: jsxContent,
      typeSignature: typeSignature,
      types: functionParams.map((p) => p.type).concat(["JSX.Element"]),
      jsxAnalysis: jsxAnalysis,
    };
  }

  context.variables[varName] = variableData;

  // Проверяем, является ли переменная функцией, и дублируем её в functions (аналогично TypeScript парсеру)
  if (isVariableFunction(node)) {
    const functionObject = createFunctionFromVariable(node, typeSignature);
    context.functions[varName] = functionObject;
  }
}

/**
 * Проверяет, является ли переменная функцией
 * @param {Object} node - узел VariableDeclarator
 * @returns {boolean} true, если переменная является функцией
 */
function isVariableFunction(node) {
  // Проверяем по инициализатору
  if (node.init) {
    // Стрелочная функция или function expression - точно функции
    if (
      node.init.type === "ArrowFunctionExpression" ||
      node.init.type === "FunctionExpression"
    ) {
      return true;
    }
  }

  // Проверяем по аннотации типа
  if (node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
    const typeNode = node.id.typeAnnotation.typeAnnotation;
    // Функциональные типы
    if (typeNode.type === "TSFunctionType") {
      return true;
    }

    // Типы-ссылки на функциональные типы
    if (typeNode.type === "TSTypeReference") {
      // Простая проверка по тексту типа
      const typeString = getNodeText(typeNode);
      if (
        typeString.includes("=>") &&
        (typeString.startsWith("(") || typeString.includes(") =>"))
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Создает объект функции из переменной-функции
 * @param {Object} node - узел VariableDeclarator
 * @param {string} typeSignature - сигнатура типа
 * @returns {Object} объект функции
 */
function createFunctionFromVariable(node, typeSignature) {
  const varName = node.id.name;

  // Парсим параметры и возвращаемый тип из типа или инициализатора
  let parameters = [];
  let returnType = "unknown";

  if (
    node.init &&
    (node.init.type === "ArrowFunctionExpression" ||
      node.init.type === "FunctionExpression")
  ) {
    // Если есть стрелочная функция или function expression
    const func = node.init;

    // Парсим параметры
    parameters = func.params.map((param) => ({
      name: param.name || "",
      type: param.typeAnnotation
        ? getTSType(param.typeAnnotation.typeAnnotation)
        : "any",
      optional: false, // В Babel AST optional обычно не так просто определить
    }));

    // Возвращаемый тип
    if (func.returnType) {
      returnType = getTSType(func.returnType.typeAnnotation);
    } else {
      // Определяем по содержимому, если это JSX - то JSX.Element
      if (func.body && getNodeText(func.body).includes("React.createElement")) {
        returnType = "JSX.Element";
      } else {
        returnType = "any";
      }
    }
  } else if (node.id.typeAnnotation && node.id.typeAnnotation.typeAnnotation) {
    // Если переменная имеет функциональный тип
    const typeNode = node.id.typeAnnotation.typeAnnotation;
    if (typeNode.type === "TSFunctionType") {
      // Парсим параметры из типа функции
      parameters = typeNode.parameters
        ? typeNode.parameters.map((param) => {
            const paramName = param.name ? param.name.name || param.name : "";
            const paramType = param.typeAnnotation
              ? getNodeText(param.typeAnnotation.typeAnnotation)
              : "any";
            return {
              name: paramName,
              type: paramType,
              optional: false,
            };
          })
        : [];

      // Возвращаемый тип
      if (typeNode.typeAnnotation) {
        returnType = getNodeText(typeNode.typeAnnotation.typeAnnotation);
      }
    }
  }

  return {
    name: varName,
    parameters: parameters,
    returnType: returnType,
    isAsync: false,
    isGenerator: false,
    isExported: false, // TODO: определить из модификаторов
    isDeclared: false,
    jsx: false, // Для обычных функций
    // Поля для обратной совместимости
    types: parameters.map((p) => p.type).concat([returnType]),
    params: parameters.map((p) => ({
      name: p.name,
      type: [p.type], // type как массив для совместимости
    })),
    returnResult: [returnType],
    typeSignature: typeSignature,
  };
}

module.exports = {
  parseSimpleVariableStatement,
  parseObjectLiteral,
};
