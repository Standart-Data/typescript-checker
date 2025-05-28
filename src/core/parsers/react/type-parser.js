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

  if (node.typeAnnotation) {
    if (node.typeAnnotation.type === "TSTypeLiteral") {
      // Объектный тип
      parsedValue = parseObjectType(node.typeAnnotation);
      typeDefinition = parsedValue ? "object" : "unknown";
    } else if (node.typeAnnotation.type === "TSUnionType") {
      // Union тип (A | B | C)
      typeDefinition = typeNodeToString(node.typeAnnotation);
    } else if (node.typeAnnotation.type === "TSTypeReference") {
      // Utility типы (Pick, Omit, etc.) и обычные ссылки на типы
      typeDefinition = typeNodeToString(node.typeAnnotation);
    } else {
      // Другие типы
      typeDefinition = getTSType(node.typeAnnotation);
    }
  }

  context.types[typeName] = {
    name: typeName,
    type: typeDefinition,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для обратной совместимости и совместимости с объектными типами
    types: [typeDefinition],
    value: typeDefinition, // Используем typeDefinition для строкового представления
  };
}

module.exports = {
  parseSimpleTypeAliasDeclaration,
  parseObjectType,
};
