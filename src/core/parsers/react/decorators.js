const t = require("@babel/types");

/**
 * Получает текстовое представление узла AST
 * @param {Object} node - узел AST
 * @returns {string} текстовое представление
 */
function getNodeText(node) {
  if (!node) return "";

  if (t.isStringLiteral(node)) {
    return `"${node.value}"`;
  }

  if (t.isNumericLiteral(node)) {
    return node.value.toString();
  }

  if (t.isBooleanLiteral(node)) {
    return node.value.toString();
  }

  if (t.isNullLiteral(node)) {
    return "null";
  }

  if (t.isIdentifier(node)) {
    return node.name;
  }

  if (t.isMemberExpression(node)) {
    return `${getNodeText(node.object)}.${getNodeText(node.property)}`;
  }

  if (t.isArrayExpression(node)) {
    const elements = node.elements.map((elem) => getNodeText(elem)).join(", ");
    return `[${elements}]`;
  }

  if (t.isObjectExpression(node)) {
    const properties = node.properties
      .map((prop) => {
        if (t.isObjectProperty(prop)) {
          const key = t.isIdentifier(prop.key)
            ? prop.key.name
            : getNodeText(prop.key);
          const value = getNodeText(prop.value);
          return `${key}: ${value}`;
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
    return `{ ${properties} }`;
  }

  if (t.isTemplateLiteral(node)) {
    let result = "`";
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.raw;
      if (i < node.expressions.length) {
        result += "${" + getNodeText(node.expressions[i]) + "}";
      }
    }
    result += "`";
    return result;
  }

  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    const params = node.params.map((param) => getNodeText(param)).join(", ");
    const body = t.isBlockStatement(node.body)
      ? "{ ... }"
      : getNodeText(node.body);
    return `(${params}) => ${body}`;
  }

  if (t.isBinaryExpression(node)) {
    return `${getNodeText(node.left)} ${node.operator} ${getNodeText(
      node.right
    )}`;
  }

  if (t.isConditionalExpression(node)) {
    return `${getNodeText(node.test)} ? ${getNodeText(
      node.consequent
    )} : ${getNodeText(node.alternate)}`;
  }

  if (t.isCallExpression(node)) {
    const callee = getNodeText(node.callee);
    const args = node.arguments.map((arg) => getNodeText(arg)).join(", ");
    return `${callee}(${args})`;
  }

  // Для всех остальных случаев пытаемся использовать toString или возвращаем пустую строку
  return node.toString?.() || "";
}

/**
 * Обрабатывает декораторы в React компонентах
 * @param {Object} path - путь к узлу AST
 * @returns {Array} массив с информацией о декораторах
 */
function parseDecorators(path) {
  const decorators = [];

  if (path.node.decorators && path.node.decorators.length > 0) {
    for (const decorator of path.node.decorators) {
      const decoratorInfo = {
        name: "",
        args: [],
      };

      if (t.isCallExpression(decorator.expression)) {
        // Для декораторов с аргументами - @Component({...})
        decoratorInfo.name = getNodeText(decorator.expression.callee);

        decorator.expression.arguments.forEach((arg) => {
          decoratorInfo.args.push(getNodeText(arg));
        });
      } else {
        // Для простых декораторов без аргументов - @Observable
        decoratorInfo.name = getNodeText(decorator.expression);
      }

      decorators.push(decoratorInfo);
    }
  }

  return decorators;
}

/**
 * Обрабатывает декораторы параметров для методов и функций
 * @param {Object} path - путь к узлу AST с параметрами
 * @returns {Array} массив с информацией о декораторах параметров
 */
function parseParamDecorators(path) {
  const paramDecorators = [];

  if (path.node.params && path.node.params.length > 0) {
    path.node.params.forEach((param, index) => {
      if (param.decorators && param.decorators.length > 0) {
        const decorators = [];

        param.decorators.forEach((decorator) => {
          const decoratorInfo = {
            name: "",
            args: [],
          };

          if (t.isCallExpression(decorator.expression)) {
            decoratorInfo.name = getNodeText(decorator.expression.callee);
            decorator.expression.arguments.forEach((arg) => {
              decoratorInfo.args.push(getNodeText(arg));
            });
          } else {
            decoratorInfo.name = getNodeText(decorator.expression);
          }

          decorators.push(decoratorInfo);
        });

        paramDecorators.push({
          parameterIndex: index,
          name: param.name ? param.name.name : `param${index}`,
          decorators,
        });
      }
    });
  }

  return paramDecorators;
}

/**
 * Обрабатывает декораторы методов, включая геттеры и сеттеры
 * @param {Object} path - путь к узлу AST метода
 * @returns {Array} массив с информацией о декораторах
 */
function parseMethodDecorators(path) {
  // Используем общую функцию parseDecorators для методов
  return parseDecorators(path);
}

/**
 * Обрабатывает декораторы свойств класса
 * @param {Object} path - путь к узлу AST свойства
 * @returns {Array} массив с информацией о декораторах
 */
function parsePropertyDecorators(path) {
  // Используем общую функцию parseDecorators для свойств
  return parseDecorators(path);
}

/**
 * Обрабатывает декораторы аксессоров (геттеров и сеттеров)
 * @param {Object} path - путь к узлу AST аксессора
 * @returns {Array} массив с информацией о декораторах
 */
function parseAccessorDecorators(path) {
  // Используем общую функцию parseDecorators для аксессоров
  return parseDecorators(path);
}

module.exports = {
  parseDecorators,
  parseParamDecorators,
  parseMethodDecorators,
  parsePropertyDecorators,
  parseAccessorDecorators,
  getNodeText,
};
