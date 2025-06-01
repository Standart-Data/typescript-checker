const ts = require("typescript");

/**
 * Обрабатывает декораторы для класса, методов, свойств и параметров
 * @param {ts.Node} node - нода с возможными декораторами
 * @returns {Array} массив информации о декораторах
 */
function parseDecorators(node) {
  // В новых версиях TypeScript декораторы находятся в node.modifiers
  // В старых версиях TypeScript декораторы находятся в node.decorators
  let decorators = [];

  // Проверяем node.decorators (старый API)
  if (node.decorators && node.decorators.length > 0) {
    decorators = node.decorators;
  }

  // Проверяем node.modifiers для декораторов (новый API)
  if (node.modifiers && node.modifiers.length > 0) {
    const decoratorModifiers = node.modifiers.filter(
      (modifier) => modifier.kind === ts.SyntaxKind.Decorator
    );
    decorators = [...decorators, ...decoratorModifiers];
  }

  if (decorators.length === 0) {
    return [];
  }

  return decorators.map((decorator) => {
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

/**
 * Парсит декораторы параметров функции или метода
 * @param {ts.ParameterDeclaration[]} parameters - массив параметров
 * @returns {Array} массив информации о декораторах параметров
 */
function parseParameterDecorators(parameters) {
  const paramDecorators = [];

  if (!parameters || parameters.length === 0) {
    return paramDecorators;
  }

  parameters.forEach((param, index) => {
    const decorators = parseDecorators(param);
    if (decorators.length > 0) {
      paramDecorators.push({
        index,
        name: param.name?.getText() || `param${index}`,
        decorators,
      });
    }
  });

  return paramDecorators;
}

module.exports = {
  parseDecorators,
  parseParameterDecorators,
};
