/**
 * Нормализует line endings к Windows-style (CRLF)
 * @param {string} text - текст для нормализации
 * @returns {string} - нормализованный текст
 */
function normalizeLineEndings(text) {
  if (!text) return text;
  return text.replace(/\r?\n/g, "\r\n");
}

/**
 * Определяет тип переменной на основе Babel AST узла
 * @param {Object} node - узел инициализатора переменной
 * @returns {string} - строковое представление типа
 */
function getVariableType(node) {
  if (!node) {
    return "unknown";
  }

  // Сначала проверяем аннотацию типа
  if (node.typeAnnotation) {
    return node.typeAnnotation.toString();
  }

  // Если нет аннотации типа, определяем по значению
  if (node.init || node.value) {
    const value = node.init || node.value;

    switch (value.type) {
      case "StringLiteral":
        return "string";
      case "NumericLiteral":
        return "number";
      case "BooleanLiteral":
        return "boolean";
      case "ArrayExpression":
        return "array";
      case "ObjectExpression":
        return "object";
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        return "function";
      case "NullLiteral":
        return "null";
      case "Identifier":
        if (value.name === "undefined") {
          return "undefined";
        }
        return "unknown";
      default:
        return "unknown";
    }
  }

  return "unknown";
}

module.exports = {
  normalizeLineEndings,
  getVariableType,
};
