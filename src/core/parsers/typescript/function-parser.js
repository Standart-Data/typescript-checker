const ts = require("typescript");
const { parseDecorators } = require("./decorators");
const { getCommonModifiers } = require("./common-utils");
const { normalizeLineEndings } = require("./utils");

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
 * Парсит объявление функции
 * @param {ts.FunctionDeclaration} node - нода функции
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleFunctionDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const functionName = node.name.text;
    const decorators = parseDecorators(node);
    const signature = checker.getSignatureFromDeclaration(node);
    let returnType = "void";
    if (signature) {
      returnType = checker.typeToString(signature.getReturnType());
    }

    const modifiers = getCommonModifiers(
      node,
      isParentDeclared,
      isModuleMember
    );

    let functionParams =
      node.parameters?.map((param) => ({
        name: param.name?.getText() || "",
        type: [
          param.type
            ? checker.typeToString(checker.getTypeAtLocation(param.type))
            : "any",
        ], // Обратная совместимость: type как массив строк
        optional: !!param.questionToken,
        initializer: param.initializer?.getText(),
      })) || [];

    // Проверяем, есть ли у функции дженерики и улучшаем связи типов
    if (node.typeParameters && node.typeParameters.length > 0) {
      functionParams = enhanceGenericTypeRelations(functionParams);
    }

    context.functions[functionName] = {
      name: functionName,
      parameters: functionParams.map((p) => ({
        // Новый формат для parameters
        name: p.name,
        type: p.type[0], // Извлекаем строку из массива для нового формата
        optional: p.optional,
        initializer: p.initializer,
      })),
      params: functionParams, // Обратная совместимость: старый формат с type как массивом
      returnType: node.type
        ? checker.typeToString(checker.getTypeAtLocation(node.type))
        : returnType,
      returnResult: [
        node.type // Обратная совместимость: returnResult как массив
          ? checker.typeToString(checker.getTypeAtLocation(node.type))
          : returnType,
      ],
      isAsync: modifiers.isAsync,
      isGenerator: modifiers.isGenerator,
      isDefault: modifiers.isDefault,
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
      decorators: decorators.length > 0 ? decorators : undefined,
      body: node.body ? normalizeLineEndings(node.body.getText()) : undefined,
    };
  }
}

module.exports = {
  parseSimpleFunctionDeclaration,
};
