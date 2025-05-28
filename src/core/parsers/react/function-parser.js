const t = require("@babel/types");
const { getTSType, getType } = require("./types");
const { getCommonModifiers } = require("./common-utils");
const { parseDecorators, parseParamDecorators } = require("./decorators");

/**
 * Извлекает элементный тип из типа массива
 * @param {string} arrayType - тип массива (например "T[]" или "string[]")
 * @returns {string} элементный тип (например "T" или "string")
 */
function extractElementType(arrayType) {
  if (arrayType.endsWith("[]")) {
    return arrayType.slice(0, -2);
  }
  return arrayType;
}

/**
 * Проверяет и модифицирует типы параметров для обеспечения правильной связи дженериков
 * @param {Array} functionParams - массив параметров функции
 * @returns {Array} модифицированный массив параметров
 */
function enhanceGenericTypeRelations(functionParams) {
  const enhancedParams = functionParams.map((param) => ({
    ...param,
    type: [...param.type],
  }));

  // Ищем параметры с типами массивов и функциональными типами
  for (let i = 0; i < enhancedParams.length; i++) {
    for (let j = 0; j < enhancedParams.length; j++) {
      if (i !== j) {
        const paramI = enhancedParams[i];
        const paramJ = enhancedParams[j];
        const typeI = paramI.type[0];
        const typeJ = paramJ.type[0];

        // Если paramI - массив, а paramJ - функция, проверяем связь через дженерики
        if (
          typeI.endsWith("[]") &&
          typeJ.includes("=>") &&
          typeJ.includes("(")
        ) {
          const elementType = extractElementType(typeI);

          // Если тип функции содержит элементный тип массива, добавляем полный тип массива
          if (typeJ.includes(elementType)) {
            if (!paramJ.type.includes(typeI)) {
              paramJ.type.push(typeI);
            }
          }
        }
      }
    }
  }

  return enhancedParams;
}

/**
 * Парсит объявление функции в React/Babel AST
 * @param {Object} path - путь к узлу FunctionDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 * @param {string} code - исходный код (опционально)
 */
function parseSimpleFunctionDeclaration(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false,
  code = null
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const funcName = node.id.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  // Парсим параметры функции
  const parameters = [];
  if (node.params && node.params.length > 0) {
    node.params.forEach((param) => {
      let paramName = "unknown";
      let paramType = "unknown";

      if (param.type === "Identifier") {
        paramName = param.name;
        if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
          paramType = getTSType(param.typeAnnotation.typeAnnotation);
        }
      } else if (param.type === "AssignmentPattern") {
        // Параметр со значением по умолчанию
        if (param.left.type === "Identifier") {
          paramName = param.left.name;
          if (
            param.left.typeAnnotation &&
            param.left.typeAnnotation.typeAnnotation
          ) {
            paramType = getTSType(param.left.typeAnnotation.typeAnnotation);
          } else {
            paramType = getType(param.right);
          }
        }
      } else if (param.type === "RestElement") {
        // Rest параметр (...args)
        if (param.argument.type === "Identifier") {
          paramName = `...${param.argument.name}`;
          if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
            paramType = getTSType(param.typeAnnotation.typeAnnotation);
          } else {
            paramType = "unknown[]";
          }
        }
      }

      parameters.push({
        name: paramName,
        type: paramType,
      });
    });
  }

  // Получаем возвращаемый тип
  let returnType = "unknown";
  if (node.returnType && node.returnType.typeAnnotation) {
    returnType = getTSType(node.returnType.typeAnnotation);
  }

  // Получаем body функции если передан код
  let functionBody = undefined;
  if (
    code &&
    node.body &&
    node.body.start !== undefined &&
    node.body.end !== undefined
  ) {
    functionBody = code.slice(node.body.start, node.body.end);
  }

  // Парсим декораторы
  const decorators = parseDecorators(path);
  const paramDecorators = parseParamDecorators(path);

  // Создаем массив параметров с type как массив для совместимости
  let functionParams = parameters.map((p) => ({
    name: p.name,
    type: [p.type], // type как массив для совместимости
  }));

  // Проверяем, есть ли у функции дженерики и улучшаем связи типов
  if (
    node.typeParameters &&
    node.typeParameters.params &&
    node.typeParameters.params.length > 0
  ) {
    functionParams = enhanceGenericTypeRelations(functionParams);
  }

  context.functions[funcName] = {
    name: funcName,
    parameters: parameters,
    returnType: returnType,
    isAsync: node.async || false,
    isGenerator: node.generator || false,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    decorators: decorators,
    paramDecorators: paramDecorators,
    // Поля для обратной совместимости
    types: parameters.map((p) => p.type).concat([returnType]),
    // Старый формат params с type как массив (с возможным расширением для дженериков)
    params: functionParams,
    // Новый формат returnResult как массив
    returnResult: [returnType],
    // Добавляем body если доступен
    ...(functionBody && { body: functionBody }),
  };
}

module.exports = {
  parseSimpleFunctionDeclaration,
};
