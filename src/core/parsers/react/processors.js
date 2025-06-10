const t = require("@babel/types");
const { getTSType, getTypeFromFCAnnotation, getType } = require("./types");
const { getCommonModifiers } = require("./common-utils");
const { getReturnJSXCode } = require("../../../utils/jsxUtils");
const { getComponentHooks } = require("./hooks");
const { analyzeJSX } = require("./jsx-analyzer");

/**
 * Находит возвращаемый JSX элемент в функции компонента
 * @param {Object} path - Путь к функции или выражению функции
 * @returns {Object|null} Возвращаемый JSX элемент или null
 */
function getReturnStatement(path) {
  let returnStatement = null;

  // Если тело функции - это выражение (стрелочная функция без {})
  if (t.isExpression(path.node.body)) {
    return path.node.body;
  }

  // Если тело функции - это блок
  if (t.isBlockStatement(path.node.body)) {
    path.node.body.body.forEach((statement) => {
      if (t.isReturnStatement(statement)) {
        returnStatement = statement.argument;
      }
    });
  }

  return returnStatement;
}

/**
 * Обрабатывает функциональный компонент React (стрелочная функция или function expression)
 * @param {Object} path - Путь к узлу AST компонента
 * @param {string} code - Исходный код
 * @param {Object} result - Объект для сохранения результатов анализа
 */
function processFunctionalComponent(path, code, result) {
  const componentName = path.node.id.name;
  const initNode = path.node.init;

  // Извлекаем typeSignature из аннотации типа переменной
  let typeSignature = null;
  if (
    path.node.id.typeAnnotation &&
    path.node.id.typeAnnotation.typeAnnotation
  ) {
    // Используем функцию getNodeText для получения строкового представления типа
    typeSignature = getNodeText(path.node.id.typeAnnotation.typeAnnotation);
  }

  // Получаем информацию о параметрах (пропсах)
  const props = [];
  if (initNode.params && initNode.params.length > 0) {
    // Обрабатываем первый параметр (обычно props)
    const propsParam = initNode.params[0];

    if (t.isIdentifier(propsParam)) {
      // Простой параметр props
      const propName = propsParam.name;
      const propType = propsParam.typeAnnotation
        ? getTSType(propsParam.typeAnnotation.typeAnnotation)
        : "any";

      props.push({ name: propName, type: propType });
    } else if (t.isObjectPattern(propsParam)) {
      // Деструктуризация объекта { prop1, prop2 }
      // Пытаемся получить типы из React.FC аннотации
      const fcTypes = getTypeFromFCAnnotation(path.node);

      propsParam.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) || t.isRestElement(prop)) {
          const propName = prop.key
            ? prop.key.name
            : prop.argument
            ? prop.argument.name
            : "unknown";

          // Пытаемся получить тип из аннотации FC, иначе из самого параметра
          let propType = "any";
          if (fcTypes[propName]) {
            propType = fcTypes[propName];
          } else if (prop.typeAnnotation) {
            propType = getTSType(prop.typeAnnotation.typeAnnotation);
          }

          props.push({ name: propName, type: propType });
        }
      });
    }
  }

  // Определяем тип возвращаемого значения (JSX)
  let returnType = "JSX.Element";

  // Получаем body из исходного кода
  let bodyText = "";
  if (
    initNode.body &&
    initNode.body.start !== undefined &&
    initNode.body.end !== undefined
  ) {
    bodyText = code.slice(initNode.body.start, initNode.body.end);
  } else {
    bodyText = "/* function body */";
  }

  // Анализируем JSX структуру
  let jsxAnalysis = null;
  if (initNode.body) {
    try {
      jsxAnalysis = analyzeJSX(initNode.body);
    } catch (error) {
      // Если анализ JSX не удался, просто продолжаем без него
      jsxAnalysis = null;
    }
  }

  // Создаем объект компонента
  const component = {
    type: "functional",
    props: props,
    returnType: returnType,
    body: normalizeLineEndings(bodyText),
    isExported: getCommonModifiers(path.node, path).isExported,
    typeSignature: typeSignature,
  };

  // Добавляем компонент в результаты
  if (!result.functions) {
    result.functions = {};
  }

  result.functions[componentName] = {
    params: props.map((p) => ({
      name: p.name,
      type: [p.type], // type как массив для совместимости
    })),
    parameters: props, // новый формат с type как строка
    returnResult: [returnType],
    returnType: returnType,
    jsx: true,
    body: component.body,
    typeSignature: typeSignature,
    jsxAnalysis: jsxAnalysis,
  };

  // Если компонент экспортируется, добавляем его в exports
  if (component.isExported) {
    if (!result.exports) {
      result.exports = {};
    }
    result.exports[componentName] = true;
  }
}

/**
 * Обрабатывает компонент React объявленный через function declaration
 * @param {Object} path - Путь к узлу AST компонента
 * @param {string} code - Исходный код
 * @param {Object} result - Объект для сохранения результатов анализа
 */
function processFunctionDeclarationComponent(path, code, result) {
  const componentName = path.node.id.name;

  // Получаем информацию о параметрах (пропсах)
  const props = [];
  if (path.node.params && path.node.params.length > 0) {
    // Обрабатываем первый параметр (обычно props)
    const propsParam = path.node.params[0];

    if (t.isIdentifier(propsParam)) {
      // Простой параметр props
      const propName = propsParam.name;
      const propType = propsParam.typeAnnotation
        ? getTSType(propsParam.typeAnnotation.typeAnnotation)
        : "any";

      props.push({ name: propName, type: propType });
    } else if (t.isObjectPattern(propsParam)) {
      // Деструктуризация объекта { prop1, prop2 }
      propsParam.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) || t.isRestElement(prop)) {
          const propName = prop.key
            ? prop.key.name
            : prop.argument
            ? prop.argument.name
            : "unknown";
          const propType = prop.typeAnnotation
            ? getTSType(prop.typeAnnotation.typeAnnotation)
            : "any";

          props.push({ name: propName, type: propType });
        }
      });
    }
  }

  // Определяем тип возвращаемого значения (JSX)
  let returnType = "JSX.Element";
  if (path.node.returnType) {
    returnType = getTSType(path.node.returnType.typeAnnotation);
  }

  // Получаем body из исходного кода
  let bodyText = "";
  if (
    path.node.body &&
    path.node.body.start !== undefined &&
    path.node.body.end !== undefined
  ) {
    bodyText = code.slice(path.node.body.start, path.node.body.end);
  } else {
    bodyText = "/* function body */";
  }

  // Анализируем JSX структуру
  let jsxAnalysis = null;
  if (path.node.body) {
    try {
      jsxAnalysis = analyzeJSX(path.node.body);
    } catch (error) {
      // Если анализ JSX не удался, просто продолжаем без него
      jsxAnalysis = null;
    }
  }

  // Создаем объект компонента
  const component = {
    type: "functional",
    props: props,
    returnType: returnType,
    body: normalizeLineEndings(bodyText),
    isExported: getCommonModifiers(path.node, path).isExported,
  };

  // Добавляем компонент в результаты
  if (!result.functions) {
    result.functions = {};
  }

  result.functions[componentName] = {
    params: props.map((p) => ({
      name: p.name,
      type: [p.type], // type как массив для совместимости
    })),
    parameters: props, // новый формат с type как строка
    returnResult: [returnType],
    returnType: returnType,
    jsx: true,
    body: component.body,
    jsxAnalysis: jsxAnalysis,
  };

  // Если компонент экспортируется, добавляем его в exports
  if (component.isExported) {
    if (!result.exports) {
      result.exports = {};
    }
    result.exports[componentName] = true;
  }
}

/**
 * Обрабатывает классовый компонент React
 * @param {Object} path - Путь к узлу AST компонента
 * @param {string} code - Исходный код
 * @param {Object} result - Объект для сохранения результатов анализа
 */
function processClassComponent(path, code, result) {
  const componentName = path.node.id.name;

  // Получаем информацию о типах пропсов и состояния из дженериков
  // Например: class MyComponent extends React.Component<MyProps, MyState>
  let propsType = "any";
  let stateType = "any";

  const superClass = path.node.superClass;
  if (
    superClass &&
    superClass.typeParameters &&
    superClass.typeParameters.params
  ) {
    if (superClass.typeParameters.params.length >= 1) {
      propsType = getTSType(superClass.typeParameters.params[0]);
    }

    if (superClass.typeParameters.params.length >= 2) {
      stateType = getTSType(superClass.typeParameters.params[1]);
    }
  }

  // Собираем методы класса
  const methods = {};
  path.node.body.body.forEach((member) => {
    if (t.isClassMethod(member) && member.kind !== "constructor") {
      const methodName = member.key.name || member.key.value;

      // Получаем body из исходного кода
      let bodyText = "";
      if (
        member.body &&
        member.body.start !== undefined &&
        member.body.end !== undefined
      ) {
        bodyText = code.slice(member.body.start, member.body.end);
      } else {
        bodyText = "/* method body */";
      }

      methods[methodName] = {
        params: member.params.map((param) => {
          const paramName = param.name || (param.left && param.left.name);
          const paramType = param.typeAnnotation
            ? getTSType(param.typeAnnotation.typeAnnotation)
            : "any";

          return { name: paramName, type: [paramType] };
        }),
        parameters: member.params.map((param) => {
          const paramName = param.name || (param.left && param.left.name);
          const paramType = param.typeAnnotation
            ? getTSType(param.typeAnnotation.typeAnnotation)
            : "any";

          return { name: paramName, type: paramType };
        }),
        returnType: member.returnType
          ? getTSType(member.returnType.typeAnnotation)
          : "any",
        returnResult: [
          member.returnType
            ? getTSType(member.returnType.typeAnnotation)
            : "any",
        ],
        body: normalizeLineEndings(bodyText),
      };
    }
  });

  // Создаем объект компонента
  const component = {
    type: "class",
    propsType: propsType,
    stateType: stateType,
    methods: methods,
    isExported: getCommonModifiers(path.node, path).isExported,
  };

  // Добавляем компонент в результаты
  if (!result.classes) {
    result.classes = {};
  }

  result.classes[componentName] = {
    methods: methods,
    extendsClass: "React.Component",
    generics: [propsType, stateType],
    jsx: true,
  };

  // Если компонент экспортируется, добавляем его в exports
  if (component.isExported) {
    if (!result.exports) {
      result.exports = {};
    }
    result.exports[componentName] = true;
  }
}

/**
 * Получает пропсы компонента из AST-узла
 */
function getComponentProps(node) {
  const props = [];

  if (!node.params || node.params.length === 0) {
    return props;
  }

  const param = node.params[0];

  // Обработка явной типизации параметра
  let paramType = "any";
  if (param.typeAnnotation) {
    paramType = getTSType(param.typeAnnotation.typeAnnotation);
  } else if (node.returnType) {
    // Пытаемся получить тип из аннотации возвращаемого значения (для FC<Props>)
    paramType = getTypeFromFCAnnotation(node);
  }

  if (t.isIdentifier(param)) {
    props.push({
      name: param.name,
      type: paramType,
    });
  } else if (t.isObjectPattern(param)) {
    // Обработка деструктуризации объекта ({a, b, c})
    param.properties.forEach((prop) => {
      let propType = "any";
      if (prop.value && prop.value.typeAnnotation) {
        propType = getTSType(prop.value.typeAnnotation.typeAnnotation);
      }

      props.push({
        name: prop.key.name,
        type: propType,
      });
    });
  }

  return props;
}

/**
 * Получает пропсы классового компонента
 */
function getClassComponentProps(path) {
  const props = [];
  const classBody = path.node.body.body;

  classBody.forEach((node) => {
    if (t.isClassProperty(node) && node.key.name === "props") {
      if (node.typeAnnotation) {
        const typeAnnotation = node.typeAnnotation.typeAnnotation;
        if (t.isTSTypeReference(typeAnnotation)) {
          const typeName = typeAnnotation.typeName.name;
          props.push({
            name: "props",
            type: typeName,
          });
        }
      }
    }
  });

  return props;
}

/**
 * Получает состояние классового компонента
 */
function getClassComponentState(path) {
  const state = [];
  const classBody = path.node.body.body;

  classBody.forEach((node) => {
    if (t.isClassProperty(node) && node.key.name === "state") {
      if (node.typeAnnotation) {
        const typeAnnotation = node.typeAnnotation.typeAnnotation;
        if (t.isTSTypeReference(typeAnnotation)) {
          const typeName = typeAnnotation.typeName.name;
          state.push({
            name: "state",
            type: typeName,
          });
        }
      }
    }
  });

  return state;
}

// Функция для нормализации line endings к Windows-style (CRLF)
function normalizeLineEndings(text) {
  if (!text) return text;
  return text.replace(/\r?\n/g, "\r\n");
}

/**
 * Получает текстовое представление узла AST (вспомогательная функция)
 * @param {Object} node - узел AST
 * @returns {string} текстовое представление
 */
function getNodeText(node) {
  if (!node) return "";

  // Простые типы
  if (node.type === "TSStringKeyword") return "string";
  if (node.type === "TSNumberKeyword") return "number";
  if (node.type === "TSBooleanKeyword") return "boolean";
  if (node.type === "TSAnyKeyword") return "any";

  // TSTypeReference - для сложных типов как FunctionComponent
  if (node.type === "TSTypeReference" && node.typeName) {
    let baseType = "";
    if (node.typeName.type === "Identifier") {
      baseType = node.typeName.name;
    } else if (node.typeName.type === "TSQualifiedName") {
      // Обрабатываем React.FunctionComponent
      baseType = getQualifiedName(node.typeName);
    }

    // Добавляем дженерики если есть
    if (
      node.typeParameters &&
      node.typeParameters.params &&
      node.typeParameters.params.length > 0
    ) {
      const generics = node.typeParameters.params
        .map((param) => getNodeText(param))
        .join(", ");
      return `${baseType}<${generics}>`;
    }

    return baseType;
  }

  // Для других типов возвращаем fallback
  return node.name || "unknown";
}

/**
 * Получает квалифицированное имя (например, React.FunctionComponent)
 * @param {Object} node - узел TSQualifiedName
 * @returns {string} квалифицированное имя
 */
function getQualifiedName(node) {
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "TSQualifiedName") {
    const left = getQualifiedName(node.left);
    const right = node.right.name;
    return `${left}.${right}`;
  }
  return "unknown";
}

module.exports = {
  processFunctionalComponent,
  processFunctionDeclarationComponent,
  processClassComponent,
  getComponentProps,
  getClassComponentProps,
  getClassComponentState,
  getReturnStatement,
  normalizeLineEndings,
  getNodeText,
  getQualifiedName,
};
