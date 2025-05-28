const t = require("@babel/types");

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
        decoratorInfo.name =
          decorator.expression.callee.name ||
          decorator.expression.callee.getText();
        decorator.expression.arguments.forEach((arg) => {
          if (t.isObjectExpression(arg)) {
            const argObj = {};
            arg.properties.forEach((prop) => {
              if (t.isObjectProperty(prop)) {
                const key = prop.key.name;
                let value;

                if (t.isStringLiteral(prop.value)) {
                  value = prop.value.value;
                } else if (t.isNumericLiteral(prop.value)) {
                  value = prop.value.value;
                } else {
                  value = prop.value.getText
                    ? prop.value.getText()
                    : prop.value.toString();
                }

                argObj[key] = value;
              }
            });
            decoratorInfo.args.push(argObj);
          } else if (t.isStringLiteral(arg)) {
            decoratorInfo.args.push(arg.value);
          } else if (t.isNumericLiteral(arg)) {
            decoratorInfo.args.push(arg.value);
          } else {
            decoratorInfo.args.push(
              arg.getText ? arg.getText() : arg.toString()
            );
          }
        });
      } else {
        // Для простых декораторов без аргументов - @Input
        decoratorInfo.name =
          decorator.expression.name || decorator.expression.getText();
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
            decoratorInfo.name =
              decorator.expression.callee.name ||
              decorator.expression.callee.getText();
            decorator.expression.arguments.forEach((arg) => {
              if (t.isStringLiteral(arg)) {
                decoratorInfo.args.push(arg.value);
              } else if (t.isNumericLiteral(arg)) {
                decoratorInfo.args.push(arg.value);
              } else {
                decoratorInfo.args.push(
                  arg.getText ? arg.getText() : arg.toString()
                );
              }
            });
          } else {
            decoratorInfo.name =
              decorator.expression.name || decorator.expression.getText();
          }

          decorators.push(decoratorInfo);
        });

        paramDecorators.push({
          index,
          name: param.name ? param.name.name : "param",
          decorators,
        });
      }
    });
  }

  return paramDecorators;
}

module.exports = {
  parseDecorators,
  parseParamDecorators,
};
