const t = require("@babel/types");

/**
 * Получает строковое представление типа TypeScript
 * @param {Object} typeNode - Узел типа из AST
 * @returns {string|Object} Строковое представление типа или объект с его структурой
 */
function getTSType(typeNode) {
  if (!typeNode) return "any";

  // Примитивные типы
  if (t.isTSStringKeyword(typeNode)) return "string";
  if (t.isTSNumberKeyword(typeNode)) return "number";
  if (t.isTSBooleanKeyword(typeNode)) return "boolean";
  if (t.isTSAnyKeyword(typeNode)) return "any";
  if (t.isTSNullKeyword(typeNode)) return "null";
  if (t.isTSUndefinedKeyword(typeNode)) return "undefined";
  if (t.isTSVoidKeyword(typeNode)) return "void";
  if (t.isTSNeverKeyword(typeNode)) return "never";
  if (t.isTSSymbolKeyword(typeNode)) return "symbol";
  if (t.isTSUnknownKeyword(typeNode)) return "unknown";
  if (t.isTSObjectKeyword(typeNode)) return "object";

  // Обработка типа в скобках (например, ((song: string) => void))
  if (t.isTSParenthesizedType(typeNode)) {
    return getTSType(typeNode.typeAnnotation);
  }

  // Ссылочные типы
  if (t.isTSTypeReference(typeNode)) {
    if (t.isIdentifier(typeNode.typeName)) {
      let typeName = typeNode.typeName.name;

      // Проверяем наличие типовых параметров
      if (typeNode.typeParameters && typeNode.typeParameters.params) {
        const typeParams = typeNode.typeParameters.params
          .map((param) => getTSType(param))
          .join(", ");
        return `${typeName}<${typeParams}>`;
      }

      return typeName;
    } else if (t.isTSQualifiedName(typeNode.typeName)) {
      // Обработка вложенных имен типов, например React.ReactNode
      const left = typeNode.typeName.left.name;
      const right = typeNode.typeName.right.name;
      return `${left}.${right}`;
    }
  }

  // Литералы
  if (t.isTSLiteralType(typeNode)) {
    if (t.isStringLiteral(typeNode.literal)) {
      return `"${typeNode.literal.value}"`;
    } else if (t.isNumericLiteral(typeNode.literal)) {
      return String(typeNode.literal.value);
    } else if (t.isBooleanLiteral(typeNode.literal)) {
      return String(typeNode.literal.value);
    }
  }

  // Объединения типов (Union)
  if (t.isTSUnionType(typeNode)) {
    return typeNode.types.map((type) => getTSType(type)).join(" | ");
  }

  if (t.isTSIntersectionType(typeNode)) {
    return typeNode.types.map((type) => getTSType(type)).join(" & ");
  }

  // Тип функции
  if (t.isTSFunctionType(typeNode)) {
    const params = typeNode.parameters
      .map((param) => {
        const paramName = param.name || "";
        const paramType = param.typeAnnotation
          ? getTSType(param.typeAnnotation.typeAnnotation)
          : "any";
        const optionalMark = param.optional ? "?" : "";
        return `${paramName}${optionalMark}: ${paramType}`;
      })
      .join(", ");

    const returnType = typeNode.typeAnnotation
      ? getTSType(typeNode.typeAnnotation.typeAnnotation)
      : "any";

    return `(${params}) => ${returnType}`;
  }

  // Типизированный массив
  if (t.isTSArrayType(typeNode)) {
    return `${getTSType(typeNode.elementType)}[]`;
  }

  // Кортеж (Tuple)
  if (t.isTSTupleType(typeNode)) {
    const types = typeNode.elementTypes
      .map((type) => getTSType(type))
      .join(", ");
    return `[${types}]`;
  }

  // Объектный тип
  if (t.isTSTypeLiteral(typeNode)) {
    const members = {};

    for (const member of typeNode.members) {
      if (t.isTSPropertySignature(member)) {
        const propertyName = member.key.name || member.key.value;
        const propertyType = member.typeAnnotation
          ? getTSType(member.typeAnnotation.typeAnnotation)
          : "any";

        members[propertyName] = propertyType;
      }
    }

    return members;
  }

  // Условный тип (Conditional Type)
  if (t.isTSConditionalType(typeNode)) {
    const checkType = getTSType(typeNode.checkType);
    const extendsType = getTSType(typeNode.extendsType);
    const trueType = getTSType(typeNode.trueType);
    const falseType = getTSType(typeNode.falseType);

    return `${checkType} extends ${extendsType} ? ${trueType} : ${falseType}`;
  }

  // По умолчанию возвращаем any
  return "any";
}

/**
 * Получает тип JavaScript значения
 * @param {Object} node - Узел AST
 * @returns {string} Строковое представление типа
 */
function getType(node) {
  if (!node) return "undefined";

  if (t.isStringLiteral(node)) return "string";
  if (t.isNumericLiteral(node)) return "number";
  if (t.isBooleanLiteral(node)) return "boolean";
  if (t.isNullLiteral(node)) return "null";
  if (t.isRegExpLiteral(node)) return "RegExp";

  if (t.isIdentifier(node)) return node.name;

  if (t.isObjectExpression(node)) return "object";
  if (t.isArrayExpression(node)) return "Array";
  if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node))
    return "Function";

  if (t.isJSXElement(node) || t.isJSXFragment(node)) return "JSX.Element";

  if (t.isCallExpression(node)) {
    if (t.isIdentifier(node.callee)) {
      // Для некоторых известных вызовов функций
      const calleeName = node.callee.name;
      if (calleeName === "useState") return "State Hook";
      if (calleeName === "useEffect") return "Effect Hook";
      if (calleeName === "useRef") return "Ref Hook";
      if (calleeName === "useCallback") return "Callback Hook";
      if (calleeName === "useMemo") return "Memo Hook";

      return `${calleeName} Call`;
    }

    return "Expression";
  }

  return "unknown";
}

/**
 * Получает типы пропсов из React.FC аннотации
 * @param {Object} node - Узел с типизацией React.FC<Props>
 * @returns {Object} Объект с типами пропсов
 */
function getTypeFromFCAnnotation(node) {
  // Ищем аннотацию типа в узле переменной
  if (
    node.id &&
    node.id.typeAnnotation &&
    node.id.typeAnnotation.typeAnnotation
  ) {
    const typeAnnotation = node.id.typeAnnotation.typeAnnotation;

    // Проверяем если это React.FC<Props>
    if (t.isTSTypeReference(typeAnnotation)) {
      if (typeAnnotation.typeName) {
        // Проверяем если это React.FC или FC
        let isFC = false;
        if (
          t.isIdentifier(typeAnnotation.typeName) &&
          typeAnnotation.typeName.name === "FC"
        ) {
          isFC = true;
        } else if (t.isTSQualifiedName(typeAnnotation.typeName)) {
          const qualified = typeAnnotation.typeName;
          if (
            qualified.left.name === "React" &&
            qualified.right.name === "FC"
          ) {
            isFC = true;
          }
        }

        if (
          isFC &&
          typeAnnotation.typeParameters &&
          typeAnnotation.typeParameters.params[0]
        ) {
          const propsType = typeAnnotation.typeParameters.params[0];

          // Если тип пропсов - это объектный литерал {name: string, age: number}
          if (t.isTSTypeLiteral(propsType)) {
            const propsInfo = {};
            propsType.members.forEach((member) => {
              if (t.isTSPropertySignature(member)) {
                const propName = member.key.name || member.key.value;
                const propType = member.typeAnnotation
                  ? getTSType(member.typeAnnotation.typeAnnotation)
                  : "any";
                propsInfo[propName] = propType;
              }
            });
            return propsInfo;
          }
        }
      }
    }
  }

  return {};
}

module.exports = {
  getTSType,
  getType,
  getTypeFromFCAnnotation,
};
