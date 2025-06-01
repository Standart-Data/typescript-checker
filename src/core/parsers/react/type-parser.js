const t = require("@babel/types");
const { getTSType } = require("./types");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объектный тип рекурсивно для React/Babel AST
 * @param {Object} typeNode - нода типа объекта
 * @returns {Object} - структурированный объект типа
 */
function parseObjectType(typeNode) {
  const result = {};

  if (!typeNode || typeNode.type !== "TSTypeLiteral") {
    return null;
  }

  if (typeNode.members) {
    typeNode.members.forEach((member) => {
      if (member.type === "TSPropertySignature") {
        const propName = member.key.name || member.key.value || "unknown";
        let propType = "unknown";

        if (member.typeAnnotation) {
          if (member.typeAnnotation.typeAnnotation.type === "TSTypeLiteral") {
            // Рекурсивно парсим вложенные объектные типы
            propType = {
              type: "object",
              value: parseObjectType(member.typeAnnotation.typeAnnotation),
            };
          } else {
            propType = getTSType(member.typeAnnotation);
          }
        }

        result[propName] = {
          type: typeof propType === "object" ? propType.type : "primitive",
          value: typeof propType === "object" ? propType.value : propType,
          isOptional: member.optional || false,
          isReadonly: member.readonly || false,
        };
      }
    });
  }

  return result;
}

/**
 * Преобразует нод типа в строку для React/Babel AST
 * @param {Object} typeNode - нода типа
 * @returns {string} - строковое представление типа
 */
function typeNodeToString(typeNode) {
  if (!typeNode) return "unknown";

  switch (typeNode.type) {
    case "TSTypeReference":
      if (typeNode.typeName && typeNode.typeName.name) {
        let result = typeNode.typeName.name;

        // Обработка дженериков
        if (typeNode.typeParameters && typeNode.typeParameters.params) {
          const params = typeNode.typeParameters.params.map((param) =>
            typeNodeToString(param)
          );
          result += `<${params.join(", ")}>`;
        }

        return result;
      }
      return "unknown";

    case "TSUnionType":
      if (typeNode.types) {
        return typeNode.types.map((type) => typeNodeToString(type)).join(" | ");
      }
      return "unknown";

    case "TSLiteralType":
      if (typeNode.literal) {
        if (typeNode.literal.type === "StringLiteral") {
          return `"${typeNode.literal.value}"`;
        } else if (typeNode.literal.type === "NumericLiteral") {
          return typeNode.literal.value.toString();
        } else if (typeNode.literal.type === "BooleanLiteral") {
          return typeNode.literal.value.toString();
        }
      }
      return "unknown";

    // Базовые TypeScript типы
    case "TSStringKeyword":
      return "string";
    case "TSNumberKeyword":
      return "number";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSNullKeyword":
      return "null";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSVoidKeyword":
      return "void";
    case "TSAnyKeyword":
      return "any";
    case "TSNeverKeyword":
      return "never";
    case "TSSymbolKeyword":
      return "symbol";
    case "TSUnknownKeyword":
      return "unknown";
    case "TSObjectKeyword":
      return "object";

    case "TSTypeQuery":
      // Обработка typeof операторов
      if (typeNode.exprName && typeNode.exprName.name) {
        return `typeof${typeNode.exprName.name}`;
      }
      return "unknown";

    case "TSTypeOperator":
      // Обработка keyof и других операторов типов
      if (typeNode.operator && typeNode.typeAnnotation) {
        const innerType = typeNodeToString(typeNode.typeAnnotation);
        return `${typeNode.operator}${innerType}`;
      }
      return "unknown";

    case "TSIndexedAccessType":
      // Для indexed access типов (typeof Statuses[keyof typeof Statuses]) обрабатываем аналогично TypeScript парсеру
      if (typeNode.objectType && typeNode.indexType) {
        const objectPart = typeNodeToString(typeNode.objectType);
        const indexPart = typeNodeToString(typeNode.indexType);
        return `${objectPart}[${indexPart}]`
          .replace(/\s+/g, "")
          .replace(/[()]/g, "");
      }
      return "unknown";

    default:
      return getTSType({ typeAnnotation: typeNode });
  }
}

/**
 * Парсит объявление типа в React/Babel AST
 * @param {Object} path - путь к узлу TSTypeAliasDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleTypeAliasDeclaration(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const typeName = node.id.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  let typeDefinition = "unknown";
  let parsedValue = null;

  // Базовая информация о типе
  const typeInfo = {
    name: typeName,
    type: typeDefinition,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для обратной совместимости и совместимости с объектными типами
    types: [typeDefinition],
    value: typeDefinition, // Используем typeDefinition для строкового представления
  };

  // Функция для анализа типа литерала
  function analyzeTypeLiteral(typeLiteralNode) {
    const callSignatures = [];
    const properties = {};

    if (typeLiteralNode.members) {
      typeLiteralNode.members.forEach((member) => {
        if (member.type === "TSCallSignatureDeclaration") {
          // Обрабатываем call signatures
          const params =
            member.parameters?.map((param) => ({
              name: param.name || "",
              type: param.typeAnnotation
                ? getTSType(param.typeAnnotation.typeAnnotation)
                : "any",
              optional: param.optional || false,
            })) || [];

          const returnType = member.typeAnnotation
            ? getTSType(member.typeAnnotation.typeAnnotation)
            : "any";

          callSignatures.push({
            params,
            returnType,
          });
        } else if (
          member.type === "TSPropertySignature" ||
          member.type === "TSMethodSignature"
        ) {
          // Обрабатываем свойства и методы
          const propName = member.key?.name || member.key?.value || "unknown";

          if (member.type === "TSMethodSignature") {
            // Метод
            const methodParams =
              member.parameters?.map((param) => ({
                name: param.name || "",
                type: param.typeAnnotation
                  ? getTSType(param.typeAnnotation.typeAnnotation)
                  : "any",
              })) || [];

            const methodReturnType = member.typeAnnotation
              ? getTSType(member.typeAnnotation.typeAnnotation)
              : "void";

            const paramString = methodParams
              .map((p) => `${p.name}: ${p.type}`)
              .join(", ");
            properties[propName] = `(${paramString}) => ${methodReturnType}`;
          } else {
            // Свойство
            const propType = member.typeAnnotation
              ? getTSType(member.typeAnnotation.typeAnnotation)
              : "any";
            properties[propName] = propType;
          }
        }
      });
    }

    return { callSignatures, properties };
  }

  // Функция для анализа функционального типа
  function analyzeFunctionType(funcTypeNode) {
    const params =
      funcTypeNode.parameters?.map((param) => ({
        name: param.name || "",
        type: param.typeAnnotation
          ? getTSType(param.typeAnnotation.typeAnnotation)
          : "any",
        optional: param.optional || false,
      })) || [];

    const returnType = funcTypeNode.typeAnnotation
      ? getTSType(funcTypeNode.typeAnnotation.typeAnnotation)
      : "any";

    return {
      params,
      returnType,
    };
  }

  if (node.typeAnnotation) {
    if (node.typeAnnotation.type === "TSIntersectionType") {
      // Обрабатываем пересечение типов (intersection types)
      let allProperties = {};
      let functionSignature = null;

      node.typeAnnotation.types.forEach((intersectionType) => {
        if (intersectionType.type === "TSTypeLiteral") {
          const analysis = analyzeTypeLiteral(intersectionType);
          // Собираем все свойства
          Object.assign(allProperties, analysis.properties);
        } else if (intersectionType.type === "TSFunctionType") {
          // Обрабатываем функциональную часть пересечения
          functionSignature = analyzeFunctionType(intersectionType);
        } else if (intersectionType.type === "TSParenthesizedType") {
          // Обрабатываем тип в скобках - может быть функциональным типом
          const innerType = intersectionType.typeAnnotation;
          if (innerType && innerType.type === "TSFunctionType") {
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
        typeInfo.value = typeNodeToString(node.typeAnnotation);
      } else {
        typeDefinition = typeNodeToString(node.typeAnnotation);
        typeInfo.type = typeDefinition;
        typeInfo.value = typeDefinition;
      }
    } else if (node.typeAnnotation.type === "TSTypeLiteral") {
      // Объектный тип
      const analysis = analyzeTypeLiteral(node.typeAnnotation);

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
        typeInfo.value = typeNodeToString(node.typeAnnotation);
      } else {
        parsedValue = parseObjectType(node.typeAnnotation);
        typeDefinition = parsedValue ? "object" : "unknown";
        typeInfo.type = typeDefinition;
        typeInfo.value = typeDefinition;
      }
    } else if (node.typeAnnotation.type === "TSUnionType") {
      // Union тип (A | B | C) - делаем как combined с possibleTypes
      const possibleTypes = [];

      node.typeAnnotation.types.forEach((typeNode) => {
        if (typeNode.type === "TSLiteralType") {
          // Литеральные типы как "седан", "кроссовер"
          if (typeNode.literal.type === "StringLiteral") {
            possibleTypes.push({
              type: "literal",
              value: typeNode.literal.value,
            });
          } else if (typeNode.literal.type === "NumericLiteral") {
            possibleTypes.push({
              type: "literal",
              value: typeNode.literal.value.toString(),
            });
          } else if (typeNode.literal.type === "BooleanLiteral") {
            possibleTypes.push({
              type: "literal",
              value: typeNode.literal.value.toString(),
            });
          }
        } else if (typeNode.type === "TSTypeLiteral") {
          // Объектные типы
          const properties = {};
          if (typeNode.members) {
            typeNode.members.forEach((member) => {
              if (member.type === "TSPropertySignature" && member.key) {
                const propName =
                  member.key.name || member.key.value || "unknown";
                let propType = "unknown";
                if (member.typeAnnotation) {
                  propType = getTSType(member.typeAnnotation);
                }
                properties[propName] = propType;
              }
            });
          }
          possibleTypes.push({
            type: "object",
            properties,
          });
        } else if (typeNode.type === "TSStringKeyword") {
          possibleTypes.push({
            type: "simple",
            value: "string",
          });
        } else if (typeNode.type === "TSNumberKeyword") {
          possibleTypes.push({
            type: "simple",
            value: "number",
          });
        } else if (typeNode.type === "TSBooleanKeyword") {
          possibleTypes.push({
            type: "simple",
            value: "boolean",
          });
        } else if (typeNode.type === "TSTypeReference") {
          // Ссылки на другие типы
          possibleTypes.push({
            type: "simple",
            value: typeNode.typeName ? typeNode.typeName.name : "unknown",
          });
        } else {
          // Другие типы
          possibleTypes.push({
            type: "simple",
            value: typeNodeToString(typeNode),
          });
        }
      });

      typeInfo.type = "combined";
      typeInfo.possibleTypes = possibleTypes;
      typeDefinition = typeNodeToString(node.typeAnnotation);
      typeInfo.value = typeDefinition;
    } else if (node.typeAnnotation.type === "TSMappedType") {
      // Mapped типы - сохраняем полное текстовое представление
      typeDefinition = typeNodeToString(node.typeAnnotation);
      typeInfo.type = "mapped";
      typeInfo.value = typeDefinition;
    } else if (node.typeAnnotation.type === "TSConditionalType") {
      // Условные типы - сохраняем полное текстовое представление
      typeDefinition = typeNodeToString(node.typeAnnotation);
      typeInfo.type = "conditional";
      typeInfo.value = typeDefinition;
    } else if (node.typeAnnotation.type === "TSTypeReference") {
      // Utility типы (Pick, Omit, etc.) и обычные ссылки на типы
      typeDefinition = typeNodeToString(node.typeAnnotation);
      typeInfo.type = typeDefinition;
      typeInfo.value = typeDefinition;
    } else if (node.typeAnnotation.type === "TSIndexedAccessType") {
      // Для indexed access типов (typeof Statuses[keyof typeof Statuses]) сохраняем исходное представление
      typeDefinition = typeNodeToString(node.typeAnnotation);
      typeInfo.type = "simple";
      typeInfo.value = typeDefinition;
    } else {
      // Другие типы
      typeDefinition = getTSType(node.typeAnnotation);
      typeInfo.type = typeDefinition;
      typeInfo.value = typeDefinition;
    }

    // Обновляем типы для обратной совместимости
    typeInfo.types = [typeInfo.value];
  }

  context.types[typeName] = typeInfo;
}

module.exports = {
  parseSimpleTypeAliasDeclaration,
  parseObjectType,
};
