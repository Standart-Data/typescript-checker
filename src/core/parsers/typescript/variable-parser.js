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
 * Анализирует type assertion или satisfies оператор в инициализаторе переменной
 * @param {ts.Node} initializer - инициализатор переменной
 * @param {ts.TypeChecker} checker - type checker
 * @returns {Object|null} информация о type assertion
 */
function analyzeTypeAssertion(initializer, checker) {
  if (!initializer) return null;

  // Сначала проверяем на type assertion в иницализаторе
  let targetNode = initializer;

  // Обработка type assertion (value as Type)
  if (ts.isAsExpression(targetNode)) {
    const typeText = targetNode.type.getText();
    // Специальная проверка для as const
    if (typeText === "const") {
      return {
        operator: "as",
        type: "const",
        originalExpression: targetNode.expression.getText(),
        fullExpression: targetNode.getText(),
      };
    }

    return {
      operator: "as",
      type: checker.typeToString(checker.getTypeAtLocation(targetNode.type)),
      originalExpression: targetNode.expression.getText(),
      fullExpression: targetNode.getText(),
    };
  }

  // Обработка type assertion angle bracket style (<Type>value)
  if (
    ts.isTypeAssertionExpression &&
    ts.isTypeAssertionExpression(targetNode)
  ) {
    return {
      operator: "as",
      type: checker.typeToString(checker.getTypeAtLocation(targetNode.type)),
      originalExpression: targetNode.expression.getText(),
      fullExpression: targetNode.getText(),
    };
  }

  // Обработка satisfies (value satisfies Type) - только для TS 4.9+
  if (ts.isSatisfiesExpression && ts.isSatisfiesExpression(targetNode)) {
    return {
      operator: "satisfies",
      type: checker.typeToString(checker.getTypeAtLocation(targetNode.type)),
      originalExpression: targetNode.expression.getText(),
      fullExpression: targetNode.getText(),
    };
  }

  // Проверяем рекурсивно для вложенных выражений
  if (ts.isParenthesizedExpression(targetNode)) {
    return analyzeTypeAssertion(targetNode.expression, checker);
  }

  return null;
}

/**
 * Проверяет, является ли переменная функцией
 * @param {ts.VariableDeclaration} declaration - декларация переменной
 * @param {ts.TypeChecker} checker - type checker
 * @returns {boolean} true, если переменная является функцией
 */
function isVariableFunction(declaration, checker) {
  // Проверяем по инициализатору
  if (declaration.initializer) {
    // Стрелочная функция или function expression - точно функции
    if (
      ts.isArrowFunction(declaration.initializer) ||
      ts.isFunctionExpression(declaration.initializer)
    ) {
      return true;
    }

    // Если инициализатор не функция, это не функция
    if (
      !ts.isArrowFunction(declaration.initializer) &&
      !ts.isFunctionExpression(declaration.initializer)
    ) {
      return false;
    }
  }

  // Проверяем по типу только если есть явное указание типа
  if (declaration.type) {
    // Функциональные типы (стрелочные или function type nodes)
    if (ts.isFunctionTypeNode(declaration.type)) {
      return true;
    }

    // Типы-ссылки на функциональные типы
    if (ts.isTypeReferenceNode(declaration.type)) {
      const typeSymbol = checker.getSymbolAtLocation(declaration.type.typeName);
      if (typeSymbol && typeSymbol.declarations) {
        for (const decl of typeSymbol.declarations) {
          if (ts.isTypeAliasDeclaration(decl)) {
            // Проверяем является ли type alias функциональным
            if (
              ts.isFunctionTypeNode(decl.type) ||
              ts.isIntersectionTypeNode(decl.type)
            ) {
              return true;
            }
          }
        }
      }
    }

    // Проверяем строковое представление типа как последний вариант
    const typeString = checker.typeToString(
      checker.getTypeAtLocation(declaration.type)
    );
    // Только если это явно функциональный тип
    if (
      typeString.includes("=>") &&
      (typeString.startsWith("(") || typeString.includes(") =>"))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Создает объект функции из декларации переменной-функции
 * @param {ts.VariableDeclaration} declaration - декларация переменной
 * @param {ts.TypeChecker} checker - type checker
 * @param {Object} modifiers - модификаторы
 * @returns {Object} объект функции
 */
function createFunctionFromVariable(declaration, checker, modifiers) {
  const varName = declaration.name.text;
  const varType = getVariableType(declaration, checker);

  // Парсим параметры и возвращаемый тип из типа или инициализатора
  let parameters = [];
  let returnType = "unknown";

  if (
    declaration.initializer &&
    (ts.isArrowFunction(declaration.initializer) ||
      ts.isFunctionExpression(declaration.initializer))
  ) {
    // Если есть стрелочная функция или function expression
    const func = declaration.initializer;

    // Парсим параметры
    parameters = func.parameters.map((param) => ({
      name: param.name?.getText() || "",
      type: param.type
        ? checker.typeToString(checker.getTypeAtLocation(param.type))
        : "any",
      optional: !!param.questionToken,
    }));

    // Возвращаемый тип
    if (func.type) {
      returnType = checker.typeToString(checker.getTypeAtLocation(func.type));
    } else {
      // Пытаемся вывести тип из сигнатуры
      const signature = checker.getSignatureFromDeclaration(func);
      if (signature) {
        returnType = checker.typeToString(signature.getReturnType());
      }
    }
  } else if (declaration.type) {
    // Если переменная имеет функциональный тип
    const typeNode = declaration.type;
    if (ts.isFunctionTypeNode(typeNode)) {
      // Парсим параметры из типа функции
      parameters = typeNode.parameters.map((param) => ({
        name: param.name?.getText() || "",
        type: param.type
          ? checker.typeToString(checker.getTypeAtLocation(param.type))
          : "any",
        optional: !!param.questionToken,
      }));

      // Возвращаемый тип
      if (typeNode.type) {
        returnType = checker.typeToString(
          checker.getTypeAtLocation(typeNode.type)
        );
      }
    }
  }

  return {
    name: varName,
    parameters: parameters,
    returnType: returnType,
    isAsync: false, // Для переменных-функций async сложно определить из типа
    isGenerator: false,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для обратной совместимости - первый элемент это тип переменной
    types: [varType].concat(parameters.map((p) => p.type)).concat([returnType]),
    params: parameters.map((p) => ({
      name: p.name,
      type: [p.type], // type как массив для совместимости
    })),
    returnResult: [returnType],
  };
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

      // Анализируем type assertion
      const typeAssertion = analyzeTypeAssertion(
        declaration.initializer,
        checker
      );

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
        typeAssertion: typeAssertion, // Новое поле для type assertion
        isExported: modifiers.isExported,
        isDeclared: modifiers.isDeclared,
        // Поля для обратной совместимости со старыми тестами
        types: [varType], // старые тесты ожидают массив типов
        value: parsedValue, // теперь может быть объектом или строкой
        // TODO: decorators on variable/property might need special handling if they exist
      };

      // Проверяем, является ли переменная функцией, и дублируем её в functions
      if (isVariableFunction(declaration, checker)) {
        const functionObject = createFunctionFromVariable(
          declaration,
          checker,
          modifiers
        );
        context.functions[varName] = functionObject;

        // Дополняем переменную специфическими полями для функций
        if (
          declaration.initializer &&
          ts.isObjectLiteralExpression(declaration.initializer)
        ) {
          // Если это объект с методами (как в exercise_14), парсим его свойства
          const objLiteral = parseObjectLiteral(
            declaration.initializer,
            checker
          );
          if (objLiteral) {
            Object.keys(objLiteral).forEach((key) => {
              context.functions[varName][key] = objLiteral[key];
            });
          }
        }
      }
    }
  });
}

module.exports = {
  parseSimpleVariableStatement,
};
