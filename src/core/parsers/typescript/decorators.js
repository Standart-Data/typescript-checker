const ts = require("typescript");

/**
 * Обрабатывает декораторы для класса, методов, свойств и параметров
 * @param {ts.Node} node - нода с возможными декораторами
 * @returns {Array} массив информации о декораторах
 */
function parseDecorators(node) {
  if (!node.decorators || node.decorators.length === 0) {
    return [];
  }

  return node.decorators.map((decorator) => {
    const expression = decorator.expression;
    let name = "";
    let args = [];

    if (expression.kind === ts.SyntaxKind.CallExpression) {
      name = expression.expression.getText();
      args = expression.arguments.map((arg) => arg.getText());
    } else {
      name = expression.getText();
    }
    return { name, args };
  });
}

module.exports = {
  parseDecorators,
};
