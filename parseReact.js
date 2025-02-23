const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

function parseReact(filePaths) {
  const result = { components: {}, variables: {} };

  filePaths.forEach((filePath) => {
    try {
      const code = fs.readFileSync(filePath, "utf-8");
      const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript", "classProperties"],
      });

      traverse(ast, {
        FunctionDeclaration(path) {
          if (isFunctionComponent(path)) {
            processFunctionComponent(path, code, result);
            path.skip();
          }
        },

        ClassDeclaration(path) {
          if (isReactClassComponent(path)) {
            processClassComponent(path, code, result);
          }
        },

        VariableDeclarator(path) {
          if (isArrowFunctionComponent(path)) {
            processArrowComponent(path, code, result);
            path.skip();
          }

          // Обработка переменных, которые не являются компонентами
          if (!isInsideComponent(path) && !isArrowFunctionComponent(path)) {
            processVariableDeclarator(path, code, result);
          }
        },
      });
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
    }
  });

  return result;
}

function processVariableDeclarator(path, code, result) {
  const varName = path.node.id.name;
  result.variables[varName] = {
    types: [getType(path.node.init)],
    value: code.slice(path.node.init?.start || path.node.start, path.node.end),
  };
}

function isFunctionComponent(path) {
  return (
    t.isFunctionDeclaration(path.node) &&
    path.node.id &&
    /^[A-Z]/.test(path.node.id.name) &&
    containsJSX(path)
  );
}

function processFunctionComponent(path, code, result) {
  const componentName = path.node.id.name;
  const componentInfo = {
    name: componentName,
    type: "function",
    code: code.slice(path.node.start, path.node.end),
    states: [],
    effects: [],
    handlers: [],
    variables: [],
    methods: [],
    returns: "",
    inheritedFrom: null,
  };

  // Сбор состояний, эффектов и обработчиков
  path.traverse({
    CallExpression(callPath) {
      if (t.isIdentifier(callPath.node.callee, { name: "useState" })) {
        const parent = callPath.findParent((p) => p.isVariableDeclarator());
        if (parent && t.isArrayPattern(parent.node.id)) {
          componentInfo.states.push({
            name: parent.node.id.elements[0].name,
            initialValue: code.slice(
              callPath.node.arguments[0].start,
              callPath.node.arguments[0].end
            ),
          });
        }
      }

      if (t.isIdentifier(callPath.node.callee, { name: "useEffect" })) {
        componentInfo.effects.push({
          code: code.slice(callPath.node.start, callPath.node.end),
          dependencies: callPath.node.arguments[1]
            ? code.slice(
                callPath.node.arguments[1].start,
                callPath.node.arguments[1].end
              )
            : undefined,
        });
      }
    },

    VariableDeclarator(varPath) {
      if (
        t.isFunctionExpression(varPath.node.init) ||
        t.isArrowFunctionExpression(varPath.node.init)
      ) {
        componentInfo.handlers.push({
          name: varPath.node.id.name,
          code: code.slice(varPath.node.start, varPath.node.end),
        });
      }
    },

    ReturnStatement(retPath) {
      componentInfo.returns = code.slice(
        retPath.node.argument.start,
        retPath.node.argument.end
      );
    },
  });

  result.components[componentName] = componentInfo;
}

function getSuperClass(superClass, code) {
  if (!superClass) return null;
  return code.slice(superClass.start, superClass.end);
}

function isInsideComponent(path) {
  return path.findParent(
    (p) =>
      (t.isFunctionDeclaration(p.node) && isFunctionComponent(p)) ||
      (t.isVariableDeclarator(p.node) && isArrowFunctionComponent(p))
  );
}

// Проверка на React-компонент (стрелочная функция)
function isArrowFunctionComponent(path) {
  return (
    t.isVariableDeclarator(path.node) &&
    t.isArrowFunctionExpression(path.node.init) &&
    path.node.id &&
    /^[A-Z]/.test(path.node.id.name) && // Проверка имени компонента
    containsJSX(path.get("init"))
  );
}

// Проверка на JSX в теле функции
function containsJSX(path) {
  let foundJSX = false;

  const checkJSX = (node) => {
    if (!node) return false;
    
    if (t.isJSXElement(node) || t.isJSXFragment(node)) {
      foundJSX = true;
      return;
    }

    if (t.isParenthesizedExpression(node)) {
      checkJSX(node.expression);
    }
    else if (t.isBlockStatement(node)) {
      node.body.forEach(stmt => {
        if (t.isReturnStatement(stmt)) {
          checkJSX(stmt.argument);
        }
      });
    }
    else if (t.isArrowFunctionExpression(node)) {
      checkJSX(node.body);
    }
  };

  const bodyNode = path.isFunctionDeclaration() 
    ? path.node.body
    : path.node;

  checkJSX(bodyNode);
  return foundJSX;
}

// Проверка на классовый компонент
function isReactClassComponent(path) {
  const renderMethod = path.get('body.body').find(m => 
    t.isClassMethod(m.node) && m.node.key.name === 'render'
  );
  
  return renderMethod && containsJSX(renderMethod.get('body'));
}

// Обработка стрелочных компонентов
function isArrowFunctionComponent(path) {
  return (
    t.isVariableDeclarator(path.node) &&
    t.isArrowFunctionExpression(path.node.init) &&
    path.node.id &&
    /^[A-Z]/.test(path.node.id.name) && // Проверка имени компонента
    containsJSX(path.get("init"))
  );
}

// Улучшаем обработку стрелочных компонентов
function processArrowComponent(path, code, result) {
  const componentName = path.node.id.name;

  // Убираем проверку на экспорт, оставляем только проверку на JSX
  if (!containsJSX(path.get("init"))) return;

  const parentNode = path.parentPath.node;
  const componentCode = code.slice(parentNode.start, parentNode.end);
  const returns = getReturnJSXCode(path.node.init.body, code);

  result.components[componentName] = {
    name: componentName,
    type: "arrow",
    code: componentCode,
    returns: returns,
    states: [],
    effects: [],
    handlers: [],
    variables: [],
    methods: [],
    inheritedFrom: null,
  };
}
// Обновляем проверку переменных
function processVariableDeclarator(path, code, result) {
  const varName = path.node.id.name;

  // Пропускаем все стрелочные функции с JSX
  if (isArrowFunctionComponent(path)) return;

  result.variables[varName] = {
    types: [getType(path.node.init)],
    value: code.slice(path.node.init?.start || path.node.start, path.node.end),
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
  const componentInfo = {
    name: componentName,
    type: "class",
    code: code.slice(path.node.start, path.node.end),
    states: [],
    effects: [],
    handlers: [],
    variables: [],
    methods: [],
    returns: "",
    inheritedFrom: getSuperClass(path.node.superClass, code),
  };

  // Используем существующий path для обхода
  path.traverse({
    ClassMethod(methodPath) {
      const methodName = methodPath.node.key.name;

      // Сбор методов
      componentInfo.methods.push({
        name: methodName,
        code: code.slice(methodPath.node.start, methodPath.node.end),
      });

      // Обработка состояния в конструкторе
      if (methodName === "constructor") {
        methodPath.traverse({
          AssignmentExpression(assignPath) {
            if (
              t.isMemberExpression(assignPath.node.left) &&
              t.isThisExpression(assignPath.node.left.object) &&
              t.isIdentifier(assignPath.node.left.property, { name: "state" })
            ) {
              componentInfo.states.push({
                name: "state",
                initialValue: code.slice(
                  assignPath.node.right.start,
                  assignPath.node.right.end
                ),
              });
            }
          },
        });
      }

      // Обработка методов жизненного цикла
      if (
        [
          "componentDidMount",
          "componentDidUpdate",
          "componentWillUnmount",
        ].includes(methodName)
      ) {
        componentInfo.effects.push({
          type: methodName,
          code: code.slice(methodPath.node.start, methodPath.node.end),
        });
      }

      // Сбор JSX из render()
      if (methodName === "render") {
        methodPath.traverse({
          ReturnStatement(returnPath) {
            componentInfo.returns = code.slice(
              returnPath.node.argument.start,
              returnPath.node.argument.end
            );
          },
        });
      }
    },
  });

  result.components[componentName] = componentInfo;
}

// Вспомогательные функции
function getReturnStatement(path) {
  const bodyNode = path.node.body;

  if (t.isBlockStatement(bodyNode)) {
    const returnStmt = bodyNode.body.find((stmt) => t.isReturnStatement(stmt));
    return returnStmt ? returnStmt.argument : null;
  } else {
    let node = bodyNode;
    while (t.isParenthesizedExpression(node)) {
      node = node.expression;
    }
    return node;
  }
}

function getType(node) {
  if (!node) return "any";
  if (t.isNumericLiteral(node)) return "number";
  if (t.isStringLiteral(node)) return "string";
  if (t.isBooleanLiteral(node)) return "boolean";
  if (t.isArrowFunctionExpression(node)) return "function";
  if (t.isObjectExpression(node)) return "object";
  return "any";
}

module.exports = { parseReact };
