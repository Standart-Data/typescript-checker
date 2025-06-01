const ts = require("typescript");
const { parseDecorators, parseParameterDecorators } = require("./decorators");
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
 * Парсит параметры функции
 * @param {ts.NodeArray<ts.ParameterDeclaration>} parameters - параметры функции
 * @param {ts.TypeChecker} checker - type checker
 * @returns {Array} массив параметров
 */
function parseParameters(parameters, checker) {
  return (
    parameters?.map((param) => ({
      name: param.name?.getText() || "",
      type: param.type
        ? checker.typeToString(checker.getTypeAtLocation(param.type))
        : "any",
      optional: !!param.questionToken,
      defaultValue: param.initializer?.getText() || null,
    })) || []
  );
}

/**
 * Парсит объявление функции с поддержкой перегрузок
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
    const paramDecorators = parseParameterDecorators(node.parameters);
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

    // Generics и тело функции
    const genericsTypes = node.typeParameters
      ? node.typeParameters.map((tp) => tp.getText().trim())
      : [];
    const body = node.body?.getText();

    // Парсим параметры для нового формата
    const parameters = parseParameters(node.parameters, checker);

    // Парсим параметры для обратной совместимости (старый формат)
    let functionParams = parameters.map((p) => ({
      ...p,
      type: [p.type], // Оборачиваем в массив для обратной совместимости
      initializer: p.defaultValue,
    }));

    // Проверяем, есть ли у функции дженерики и улучшаем связи типов
    if (node.typeParameters && node.typeParameters.length > 0) {
      functionParams = enhanceGenericTypeRelations(functionParams);
    }

    // Проверяем, есть ли уже функция с таким именем
    if (context.functions[functionName]) {
      // Это может быть перегрузка или основная реализация
      const existingFunction = context.functions[functionName];

      if (node.body) {
        // Основная реализация функции
        existingFunction.parameters = parameters;
        existingFunction.params = functionParams;
        existingFunction.returnType = node.type
          ? checker.typeToString(checker.getTypeAtLocation(node.type))
          : returnType;
        existingFunction.returnResult = [
          node.type
            ? checker.typeToString(checker.getTypeAtLocation(node.type))
            : returnType,
        ];
        existingFunction.genericsTypes = genericsTypes;
        existingFunction.body = normalizeLineEndings(node.body.getText());
        existingFunction.isAsync = modifiers.isAsync;
        existingFunction.isGenerator = modifiers.isGenerator;
        existingFunction.isDefault = modifiers.isDefault;
        existingFunction.isExported = modifiers.isExported;
        existingFunction.isDeclared = modifiers.isDeclared;
        existingFunction.decorators =
          decorators.length > 0 ? decorators : undefined;
        existingFunction.paramDecorators =
          paramDecorators.length > 0 ? paramDecorators : undefined;
      } else {
        // Добавление перегрузки
        const overloadCount = Object.keys(existingFunction).filter((k) =>
          k.startsWith("overload")
        ).length;
        const overloadKey = `overload${overloadCount}`;

        existingFunction[overloadKey] = {
          name: functionName,
          parameters: parameters,
          params: parameters.map((p) => ({ ...p, type: p.type })), // Убираем обёртку в массив для перегрузок
          returnType: node.type
            ? checker.typeToString(checker.getTypeAtLocation(node.type))
            : returnType,
          returnResult: [
            node.type
              ? checker.typeToString(checker.getTypeAtLocation(node.type))
              : returnType,
          ],
          genericsTypes,
          body: null, // У перегрузок нет тела
        };
      }
    } else {
      // Первое объявление функции
      context.functions[functionName] = {
        name: functionName,
        parameters: parameters,
        params: functionParams,
        returnType: node.type
          ? checker.typeToString(checker.getTypeAtLocation(node.type))
          : returnType,
        returnResult: [
          node.type
            ? checker.typeToString(checker.getTypeAtLocation(node.type))
            : returnType,
        ],
        genericsTypes,
        isAsync: modifiers.isAsync,
        isGenerator: modifiers.isGenerator,
        isDefault: modifiers.isDefault,
        isExported: modifiers.isExported,
        isDeclared: modifiers.isDeclared,
        decorators: decorators.length > 0 ? decorators : undefined,
        paramDecorators:
          paramDecorators.length > 0 ? paramDecorators : undefined,
        body: node.body ? normalizeLineEndings(node.body.getText()) : undefined,
      };

      // Если это перегрузка (нет тела), добавляем её как overload0
      if (!node.body) {
        context.functions[functionName].overload0 = {
          name: functionName,
          parameters: parameters,
          params: parameters.map((p) => ({ ...p, type: p.type })), // Убираем обёртку в массив для перегрузок
          returnType: node.type
            ? checker.typeToString(checker.getTypeAtLocation(node.type))
            : returnType,
          returnResult: [
            node.type
              ? checker.typeToString(checker.getTypeAtLocation(node.type))
              : returnType,
          ],
          genericsTypes,
          body: null,
        };
      }
    }
  }
}

module.exports = {
  parseSimpleFunctionDeclaration,
};
