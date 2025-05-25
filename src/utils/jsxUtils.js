const t = require("@babel/types");

/**
 * Получает выражение возврата из функции
 */
function getReturnStatement(path) {
  let body = path.get("body");

  if (!body) return null;

  if (body.isBlockStatement()) {
    const returnStmt = body.get("body").find((p) => p.isReturnStatement());
    return returnStmt ? returnStmt.get("argument").node : null;
  } else {
    let node = body.node;
    while (t.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    return node;
  }
}

/**
 * Извлекает JSX код из возвращаемого выражения
 */
function getReturnJSXCode(node, code) {
  if (!node) return "";

  let currentNode = node;

  // Если body - это JSX напрямую (для стрелочных функций без блоков)
  if (t.isJSXElement(currentNode) || t.isJSXFragment(currentNode)) {
    return code.slice(currentNode.start, currentNode.end);
  }

  // Если body - это блок с return
  if (t.isBlockStatement(currentNode)) {
    const returnStatement = currentNode.body.find((stmt) =>
      t.isReturnStatement(stmt)
    );
    if (returnStatement && returnStatement.argument) {
      return code.slice(
        returnStatement.argument.start,
        returnStatement.argument.end
      );
    }
  }

  // Если body - это выражение в скобках
  while (t.isParenthesizedExpression(currentNode)) {
    currentNode = currentNode.expression;
  }

  return code.slice(currentNode.start, currentNode.end);
}

module.exports = {
  getReturnStatement,
  getReturnJSXCode,
};
