const t = require("@babel/types");

/**
 * Находит возвращаемый JSX элемент в функции компонента
 * @param {Object} path - Путь к функции или выражению функции
 * @returns {Object|null} Возвращаемый JSX элемент или null
 */
function getReturnStatement(path) {
  let returnStatement = null;

  // Если тело функции - это выражение (стрелочная функция без {})
  if (t.isExpression(path.node.body)) {
    return path.node.body;
  }

  // Если тело функции - это блок
  if (t.isBlockStatement(path.node.body)) {
    path.node.body.body.forEach((statement) => {
      if (t.isReturnStatement(statement)) {
        returnStatement = statement.argument;
      }
    });
  }

  return returnStatement;
}

/**
 * Извлекает JSX код из возвращаемого значения
 * @param {Object} bodyNode - Узел тела функции
 * @param {string} code - Исходный код
 * @returns {string} Код JSX элемента
 */
function getReturnJSXCode(bodyNode, code) {
  // Если тело функции - это выражение (стрелочная функция без {})
  if (t.isExpression(bodyNode)) {
    if (t.isJSXElement(bodyNode) || t.isJSXFragment(bodyNode)) {
      return code.slice(bodyNode.start, bodyNode.end);
    }
  }

  // Если тело функции - это блок
  if (t.isBlockStatement(bodyNode)) {
    // Ищем return statement с JSX
    for (const statement of bodyNode.body) {
      if (t.isReturnStatement(statement) && statement.argument) {
        if (
          t.isJSXElement(statement.argument) ||
          t.isJSXFragment(statement.argument)
        ) {
          return code.slice(statement.argument.start, statement.argument.end);
        }
      }
    }
  }

  return "";
}

/**
 * Проверяет, содержит ли функция возвращаемый JSX элемент
 * @param {Object} bodyNode - Узел тела функции
 * @returns {boolean} Содержит ли функция JSX
 */
function hasJSXReturn(bodyNode) {
  // Если тело функции - это выражение (стрелочная функция без {})
  if (t.isExpression(bodyNode)) {
    return t.isJSXElement(bodyNode) || t.isJSXFragment(bodyNode);
  }

  // Если тело функции - это блок
  if (t.isBlockStatement(bodyNode)) {
    // Ищем return statement с JSX
    return bodyNode.body.some((statement) => {
      return (
        t.isReturnStatement(statement) &&
        statement.argument &&
        (t.isJSXElement(statement.argument) ||
          t.isJSXFragment(statement.argument))
      );
    });
  }

  return false;
}

/**
 * Извлекает пропсы (атрибуты) из JSX элемента
 * @param {Object} jsxElement - JSX элемент
 * @returns {Object} Объект с пропсами
 */
function getJSXProps(jsxElement) {
  if (!t.isJSXElement(jsxElement)) return {};

  const props = {};

  jsxElement.openingElement.attributes.forEach((attr) => {
    if (t.isJSXAttribute(attr)) {
      const name = attr.name.name;

      // Значение может быть литералом или выражением
      if (attr.value) {
        if (t.isStringLiteral(attr.value)) {
          props[name] = attr.value.value;
        } else if (t.isJSXExpressionContainer(attr.value)) {
          props[name] = `<Expression>`;
        }
      } else {
        // Для булевых атрибутов без значения (например <Button disabled />)
        props[name] = true;
      }
    }
  });

  return props;
}

module.exports = {
  getReturnStatement,
  getReturnJSXCode,
  hasJSXReturn,
  getJSXProps,
};
