const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

function parseReact(filePaths) {
  const result = { components: {}, variables: {} };

  filePaths.forEach(filePath => {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'classProperties']
      });

      // Основной обход AST
      traverse(ast, {
        // Обработка переменных (только НЕ компоненты)
        VariableDeclarator(path) {
          if (!isReactComponent(path)) {
            const varName = path.node.id.name;
            result.variables[varName] = {
              types: [getType(path.node.init)],
              value: path.node.init?.loc ? code.slice(
                path.node.init.start,
                path.node.end
              ) : undefined
            };
          }
        },

        // Обработка классовых компонентов
        ClassDeclaration(path) {
          if (isReactClassComponent(path)) {
            processClassComponent(path, code, result);
          }
        }
      });

      // Отдельный обход для стрелочных компонентов
      traverse(ast, {
        VariableDeclarator(path) {
          if (isArrowFunctionComponent(path)) {
            processArrowComponent(path, code, result);
          }
        }
      });

    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
    }
  });

  return result;
}

// Проверка на React-компонент (стрелочная функция)
function isArrowFunctionComponent(path) {
  return (
    t.isVariableDeclarator(path.node) &&
    t.isArrowFunctionExpression(path.node.init) &&
    t.isJSXElement(getReturnStatement(path.get('init')))
  );
}

// Проверка на классовый компонент
function isReactClassComponent(path) {
  return (
    path.node.superClass?.name === 'Component' ||
    path.node.superClass?.property?.name === 'Component'
  );
}

// Обработка стрелочных компонентов
function processArrowComponent(path, code, result) {
  const componentName = path.node.id.name;
  const componentCode = code.slice(path.node.start, path.node.end);
  const returns = code.slice(
    path.node.init.body.start,
    path.node.init.body.end
  );

  result.components[componentName] = {
    code: componentCode,
    returns: returns.replace(/^\(|\)$/g, '').trim()
  };
}

// Обработка классовых компонентов
function processClassComponent(path, code, result) {
  const componentName = path.node.id.name;
  const componentCode = code.slice(path.node.start, path.node.end);
  const renderMethod = path.node.body.body.find(m => 
    t.isClassMethod(m) && m.key.name === 'render'
  );
  
  const returns = renderMethod 
    ? code.slice(
        renderMethod.body.start,
        renderMethod.body.end
      ).replace(/^{|}$/g, '').trim()
    : null;

  if (returns) {
    result.components[componentName] = {
      code: componentCode,
      returns: returns
    };
  }
}

// Вспомогательные функции
function getReturnStatement(path) {
  return path.node.body?.body?.find(n => t.isReturnStatement(n))?.argument;
}

function getType(node) {
  if (!node) return 'any';
  if (t.isNumericLiteral(node)) return 'number';
  if (t.isStringLiteral(node)) return 'string';
  if (t.isBooleanLiteral(node)) return 'boolean';
  if (t.isArrowFunctionExpression(node)) return 'function';
  if (t.isObjectExpression(node)) return 'object';
  return 'any';
}

module.exports = { parseReact };
