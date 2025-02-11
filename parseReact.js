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
          if (!isArrowFunctionComponent(path)) {
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
    containsJSX(path.get('init'))
  );
}

// Проверка на JSX в теле функции
function containsJSX(path) {
  const returnStatement = getReturnStatement(path);
  return t.isJSXElement(returnStatement) || t.isJSXFragment(returnStatement);
}

// Проверка на классовый компонент
function isReactClassComponent(path) {
  const superClass = path.node.superClass;
  return (
    (t.isIdentifier(superClass) && superClass.name === 'Component') ||
    (t.isMemberExpression(superClass) && 
     t.isIdentifier(superClass.object, { name: 'React' }) &&
     t.isIdentifier(superClass.property, { name: 'Component' }))
  );
}

// Обработка стрелочных компонентов
function processArrowComponent(path, code, result) {
  const componentName = path.node.id.name;
  const parentNode = path.parentPath.node; // Получаем VariableDeclaration
  const componentCode = code.slice(parentNode.start, parentNode.end);
  const arrowFunction = path.node.init;
  const returns = getReturnJSXCode(arrowFunction.body, code);

  result.components[componentName] = {
    code: componentCode,
    returns: returns
  };
}

// Извлечение JSX кода возврата
function getReturnJSXCode(node, code) {
  let currentNode = node;
  while (t.isParenthesizedExpression(currentNode)) {
    currentNode = currentNode.expression;
  }
  return code.slice(currentNode.start, currentNode.end);
}

// Обработка классовых компонентов
function processClassComponent(path, code, result) {
  const componentName = path.node.id.name;
  const componentCode = code.slice(path.node.start, path.node.end);
  const renderMethod = path.node.body.body.find(m => 
    t.isClassMethod(m) && m.key.name === 'render'
  );
  
  let returns = '';
  if (renderMethod) {
    const renderBody = renderMethod.body;
    returns = code.slice(renderBody.start, renderBody.end)
      .replace(/^{|}$/g, '')
      .trim();
  }

  if (returns) {
    result.components[componentName] = {
      code: componentCode,
      returns: returns
    };
  }
}

// Вспомогательные функции
function getReturnStatement(path) {
  let body = path.get('body');
  if (body.isBlockStatement()) {
    const returnStmt = body.get('body').find(p => p.isReturnStatement());
    return returnStmt ? returnStmt.get('argument').node : null;
  } else {
    let node = body.node;
    while (t.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    return node;
  }
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