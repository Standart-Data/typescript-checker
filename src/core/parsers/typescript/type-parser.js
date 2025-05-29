const ts = require("typescript");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит union тип в отдельные возможные типы
 * @param {ts.UnionTypeNode} unionNode - нода union типа
 * @param {ts.TypeChecker} checker - type checker
 * @returns {Array} - массив возможных типов
 */
function parseUnionType(unionNode, checker) {
  const possibleTypes = [];

  unionNode.types.forEach((typeNode) => {
    if (ts.isLiteralTypeNode(typeNode)) {
      // Литеральные типы как "седан", "кроссовер"
      if (ts.isStringLiteral(typeNode.literal)) {
        possibleTypes.push({
          type: "literal",
          value: typeNode.literal.text,
        });
      } else if (ts.isNumericLiteral(typeNode.literal)) {
        possibleTypes.push({
          type: "literal",
          value: typeNode.literal.text,
        });
      } else if (
        typeNode.literal.kind === ts.SyntaxKind.TrueKeyword ||
        typeNode.literal.kind === ts.SyntaxKind.FalseKeyword
      ) {
        possibleTypes.push({
          type: "literal",
          value: typeNode.literal.getText(),
        });
      }
    } else if (ts.isTypeLiteralNode(typeNode)) {
      // Объектные типы
      const properties = {};
      typeNode.members.forEach((member) => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const propType = member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : "any";
          properties[propName] = propType;
        }
      });
      possibleTypes.push({
        type: "object",
        properties,
      });
    } else if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
      possibleTypes.push({
        type: "simple",
        value: "string",
      });
    } else if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
      possibleTypes.push({
        type: "simple",
        value: "number",
      });
    } else if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
      possibleTypes.push({
        type: "simple",
        value: "boolean",
      });
    } else if (ts.isTypeReferenceNode(typeNode)) {
      // Ссылки на другие типы
      possibleTypes.push({
        type: "simple",
        value: typeNode.typeName.getText(),
      });
    } else {
      // Другие типы
      possibleTypes.push({
        type: "simple",
        value: checker.typeToString(checker.getTypeAtLocation(typeNode)),
      });
    }
  });

  return possibleTypes;
}

/**
 * Парсит объявление типа (type alias)
 * @param {ts.TypeAliasDeclaration} node - нода типа
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleTypeAliasDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const typeName = node.name.text;

    // Для union типов берём исходное текстовое представление
    let typeDefinition;
    if (ts.isUnionTypeNode(node.type)) {
      typeDefinition = node.type.getText();
    } else if (ts.isTypeReferenceNode(node.type)) {
      // Для utility типов (Pick, Omit, etc.) берём исходное текстовое представление
      typeDefinition = node.type.getText();
    } else {
      typeDefinition = checker.typeToString(
        checker.getTypeAtLocation(node.type)
      );
    }

    const modifiers = getCommonModifiers(
      node,
      isParentDeclared,
      isModuleMember
    );

    // Базовая информация о типе
    const typeInfo = {
      name: typeName,
      definition: typeDefinition,
      value: typeDefinition,
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
    };

    // Специальная обработка union типов
    if (node.type && ts.isUnionTypeNode(node.type)) {
      typeInfo.type = "combined";
      typeInfo.possibleTypes = parseUnionType(node.type, checker);
    } else if (node.type && ts.isTypeLiteralNode(node.type)) {
      // Объектные типы - анализируем их свойства
      const properties = {};
      node.type.members.forEach((member) => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const propType = member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : "any";
          properties[propName] = propType;
        }
      });
      typeInfo.type = "object";
      typeInfo.properties = properties;
    } else if (
      node.type &&
      (ts.isTypeReferenceNode(node.type) ||
        node.type.kind === ts.SyntaxKind.StringKeyword ||
        node.type.kind === ts.SyntaxKind.NumberKeyword ||
        node.type.kind === ts.SyntaxKind.BooleanKeyword)
    ) {
      // Простые типы и ссылки на типы
      typeInfo.type = "simple";
    }

    // Функция для анализа типа литерала
    function analyzeTypeLiteral(typeLiteralNode) {
      const callSignatures = [];
      const properties = {};

      typeLiteralNode.members.forEach((member) => {
        if (ts.isCallSignatureDeclaration(member)) {
          // Обрабатываем call signatures: (name?: string): string;
          const params =
            member.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
              optional: !!param.questionToken,
            })) || [];

          const returnType = member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : "any";

          callSignatures.push({
            params,
            returnType,
          });
        } else if (
          ts.isPropertySignature(member) ||
          ts.isMethodSignature(member)
        ) {
          // Обрабатываем свойства и методы
          const propName = member.name?.getText();
          if (propName) {
            if (ts.isMethodSignature(member)) {
              // Метод: setDefaultName(newName: string): void;
              const methodParams =
                member.parameters?.map((param) => ({
                  name: param.name?.getText() || "",
                  type: param.type
                    ? checker.typeToString(
                        checker.getTypeAtLocation(param.type)
                      )
                    : "any",
                })) || [];

              const methodReturnType = member.type
                ? checker.typeToString(checker.getTypeAtLocation(member.type))
                : "void";

              const paramString = methodParams
                .map((p) => `${p.name}: ${p.type}`)
                .join(", ");
              properties[propName] = `(${paramString}) => ${methodReturnType}`;
            } else {
              // Свойство: defaultName: string;
              const propType = member.type
                ? checker.typeToString(checker.getTypeAtLocation(member.type))
                : "any";
              properties[propName] = propType;
            }
          }
        }
      });

      return { callSignatures, properties };
    }

    // Функция для анализа функционального типа
    function analyzeFunctionType(funcTypeNode) {
      const params =
        funcTypeNode.parameters?.map((param) => ({
          name: param.name?.getText() || "",
          type: param.type
            ? checker.typeToString(checker.getTypeAtLocation(param.type))
            : "any",
          optional: !!param.questionToken,
        })) || [];

      const returnType = funcTypeNode.type
        ? checker.typeToString(checker.getTypeAtLocation(funcTypeNode.type))
        : "any";

      return {
        params,
        returnType,
      };
    }

    // Детальный анализ для разных типов
    if (node.type && ts.isIntersectionTypeNode(node.type)) {
      // Обрабатываем пересечение типов (intersection types)
      let allProperties = {};
      let functionSignature = null;

      node.type.types.forEach((intersectionType) => {
        if (ts.isTypeLiteralNode(intersectionType)) {
          const analysis = analyzeTypeLiteral(intersectionType);
          // Собираем все свойства
          Object.assign(allProperties, analysis.properties);
        } else if (ts.isFunctionTypeNode(intersectionType)) {
          // Обрабатываем функциональную часть пересечения
          functionSignature = analyzeFunctionType(intersectionType);
        } else if (ts.isParenthesizedTypeNode(intersectionType)) {
          // Обрабатываем тип в скобках - может быть функциональным типом
          const innerType = intersectionType.type;
          if (ts.isFunctionTypeNode(innerType)) {
            functionSignature = analyzeFunctionType(innerType);
          }
        }
      });

      // Если есть функциональная сигнатура, это гибридный тип
      if (functionSignature) {
        typeInfo.type = "function";
        typeInfo.properties = allProperties;
        typeInfo.params = functionSignature.params.map((param) => ({
          name: param.name,
          type: param.type, // Как строка, не массив
          optional: param.optional,
        }));
        typeInfo.returnType = functionSignature.returnType;
      }
    } else if (node.type && ts.isTypeLiteralNode(node.type)) {
      const analysis = analyzeTypeLiteral(node.type);

      // Если есть call signatures, это функциональный тип
      if (analysis.callSignatures.length > 0) {
        typeInfo.type = "function";
        typeInfo.properties = analysis.properties;

        // Добавляем информацию о параметрах из первой call signature
        if (analysis.callSignatures[0].params.length > 0) {
          typeInfo.params = analysis.callSignatures[0].params;
        }
        if (analysis.callSignatures[0].returnType) {
          typeInfo.returnType = analysis.callSignatures[0].returnType;
        }
      }
    } else if (node.type && ts.isFunctionTypeNode(node.type)) {
      // Обрабатываем простые функциональные типы: (name?: string) => string
      const functionSignature = analyzeFunctionType(node.type);

      typeInfo.type = "function";
      typeInfo.params = functionSignature.params.map((param) => ({
        name: param.name,
        type: param.type,
        optional: param.optional,
      }));
      typeInfo.returnType = functionSignature.returnType;
    }

    context.types[typeName] = typeInfo;
  }
}

module.exports = {
  parseSimpleTypeAliasDeclaration,
};
