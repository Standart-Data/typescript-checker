const t = require("@babel/types");
const traverse = require("@babel/traverse").default;

/**
 * Проверяет, является ли вызов функции хуком React
 * @param {Object} path - Путь к узлу AST вызова функции
 * @returns {boolean} Является ли вызов хуком React
 */
function isHookCall(path) {
  if (!t.isCallExpression(path.node)) return false;

  // Проверяем, что вызывается идентификатор (имя функции)
  if (!t.isIdentifier(path.node.callee)) return false;

  // Получаем имя вызываемой функции
  const calleeName = path.node.callee.name;

  // Проверяем, что имя начинается с "use" и второй символ в верхнем регистре
  // Это соответствует соглашению об именовании хуков React
  return (
    calleeName.startsWith("use") &&
    calleeName.length > 3 &&
    calleeName[3] === calleeName[3].toUpperCase()
  );
}

/**
 * Обрабатывает хуки React и сохраняет информацию о них
 * @param {Object} path - Путь к узлу AST вызова хука
 * @param {string} code - Исходный код
 * @param {Object} result - Объект для сохранения результатов анализа
 */
function processHook(path, code, result) {
  if (!isHookCall(path)) return;

  const hookName = path.node.callee.name;

  // Для специальных хуков делаем специальную обработку
  switch (hookName) {
    case "useState":
      processUseStateHook(path, code, result);
      break;
    case "useEffect":
    case "useLayoutEffect":
      processEffectHook(path, code, result, hookName);
      break;
    case "useCallback":
      processCallbackHook(path, code, result);
      break;
    case "useMemo":
      processMemoHook(path, code, result);
      break;
    case "useRef":
      processRefHook(path, code, result);
      break;
    default:
      // Для остальных хуков делаем общую обработку
      processGenericHook(path, code, result, hookName);
  }
}

/**
 * Обрабатывает хук useState
 */
function processUseStateHook(path, code, result) {
  const hookName = "useState";
  const initialState = path.node.arguments[0];

  // Пытаемся определить тип состояния из аргумента
  let stateType = "unknown";

  if (initialState) {
    if (t.isNumericLiteral(initialState)) {
      stateType = "number";
    } else if (t.isStringLiteral(initialState)) {
      stateType = "string";
    } else if (t.isBooleanLiteral(initialState)) {
      stateType = "boolean";
    } else if (t.isArrayExpression(initialState)) {
      stateType = "array";
    } else if (t.isObjectExpression(initialState)) {
      stateType = "object";
    } else if (t.isNullLiteral(initialState)) {
      stateType = "null";
    }
  }

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    type: stateType,
    initialValue: initialState
      ? code.slice(initialState.start, initialState.end)
      : undefined,
  });
}

/**
 * Обрабатывает хук useEffect или useLayoutEffect
 */
function processEffectHook(path, code, result, hookName) {
  const effect = path.node.arguments[0];
  const dependencies = path.node.arguments[1];

  let dependenciesType = "unknown";

  if (!dependencies) {
    dependenciesType = "none"; // Зависимости не указаны
  } else if (t.isArrayExpression(dependencies)) {
    if (dependencies.elements.length === 0) {
      dependenciesType = "empty"; // Пустой массив []
    } else {
      dependenciesType = "array"; // Массив с зависимостями
    }
  }

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    dependencies: dependenciesType,
    effectBody: effect ? code.slice(effect.start, effect.end) : undefined,
  });
}

/**
 * Обрабатывает хук useCallback
 */
function processCallbackHook(path, code, result) {
  const hookName = "useCallback";
  const callback = path.node.arguments[0];
  const dependencies = path.node.arguments[1];

  let dependenciesType = "unknown";

  if (!dependencies) {
    dependenciesType = "none";
  } else if (t.isArrayExpression(dependencies)) {
    if (dependencies.elements.length === 0) {
      dependenciesType = "empty";
    } else {
      dependenciesType = "array";
    }
  }

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    dependencies: dependenciesType,
    callbackBody: callback
      ? code.slice(callback.start, callback.end)
      : undefined,
  });
}

/**
 * Обрабатывает хук useMemo
 */
function processMemoHook(path, code, result) {
  const hookName = "useMemo";
  const factory = path.node.arguments[0];
  const dependencies = path.node.arguments[1];

  let dependenciesType = "unknown";

  if (!dependencies) {
    dependenciesType = "none";
  } else if (t.isArrayExpression(dependencies)) {
    if (dependencies.elements.length === 0) {
      dependenciesType = "empty";
    } else {
      dependenciesType = "array";
    }
  }

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    dependencies: dependenciesType,
    factoryBody: factory ? code.slice(factory.start, factory.end) : undefined,
  });
}

/**
 * Обрабатывает хук useRef
 */
function processRefHook(path, code, result) {
  const hookName = "useRef";
  const initialValue = path.node.arguments[0];

  // Пытаемся определить тип из аргумента
  let refType = "unknown";

  if (initialValue) {
    if (t.isNumericLiteral(initialValue)) {
      refType = "number";
    } else if (t.isStringLiteral(initialValue)) {
      refType = "string";
    } else if (t.isBooleanLiteral(initialValue)) {
      refType = "boolean";
    } else if (t.isArrayExpression(initialValue)) {
      refType = "array";
    } else if (t.isObjectExpression(initialValue)) {
      refType = "object";
    } else if (t.isNullLiteral(initialValue)) {
      refType = "null";
    }
  } else {
    refType = "null"; // По умолчанию useRef() инициализируется как null
  }

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    type: refType,
    initialValue: initialValue
      ? code.slice(initialValue.start, initialValue.end)
      : undefined,
  });
}

/**
 * Обрабатывает общий хук
 */
function processGenericHook(path, code, result, hookName) {
  // Собираем аргументы хука
  const args = path.node.arguments.map((arg) => {
    return code.slice(arg.start, arg.end);
  });

  // Добавляем информацию о хуке в результаты
  if (!result.hooks) {
    result.hooks = {};
  }

  if (!result.hooks[hookName]) {
    result.hooks[hookName] = [];
  }

  result.hooks[hookName].push({
    arguments: args,
  });
}

/**
 * Получает зависимости хука
 */
function getHookDependencies(path) {
  const deps = [];
  if (path.node.arguments.length > 1) {
    const depsArray = path.node.arguments[1];
    if (t.isArrayExpression(depsArray)) {
      depsArray.elements.forEach((element) => {
        if (t.isIdentifier(element)) {
          deps.push(element.name);
        }
      });
    }
  }
  return deps;
}

/**
 * Определяет тип хука
 */
function getHookType(path) {
  const hookName = path.node.callee.name;
  switch (hookName) {
    case "useState":
      return "state";
    case "useEffect":
      return "effect";
    case "useCallback":
      return "callback";
    case "useMemo":
      return "memo";
    case "useRef":
      return "ref";
    default:
      return "custom";
  }
}

/**
 * Получает все хуки, используемые в компоненте
 */
function getComponentHooks(node) {
  const hooks = [];
  try {
    traverse(
      { type: "Program", body: [node] },
      {
        CallExpression(path) {
          if (isHookCall(path)) {
            hooks.push({
              name: path.node.callee.name,
              type: getHookType(path),
              dependencies: getHookDependencies(path),
            });
          }
        },
      },
      undefined,
      { path: [] }
    );
  } catch (error) {
    console.error("Error analyzing hooks:", error.message);
  }
  return hooks;
}

module.exports = {
  isHookCall,
  processHook,
  getHookDependencies,
  getHookType,
  getComponentHooks,
};
