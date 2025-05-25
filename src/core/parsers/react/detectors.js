const t = require("@babel/types");

/**
 * Проверяет, является ли переменная стрелочным функциональным компонентом React
 */
function isArrowFunctionComponent(path) {
  if (
    !t.isVariableDeclarator(path.node) ||
    !t.isArrowFunctionExpression(path.node.init)
  ) {
    return false;
  }

  // Проверка для export const Component: React.FC<Props> = () => {};
  if (
    path.parent &&
    path.parent.parent &&
    t.isExportNamedDeclaration(path.parent.parent)
  ) {
    // Если это экспортируемый компонент, проверяем наличие типизации
    if (path.node.id.typeAnnotation) {
      const typeAnnotation = path.node.id.typeAnnotation.typeAnnotation;
      if (t.isTSTypeReference(typeAnnotation)) {
        // Проверяем простое имя типа (FC, FunctionComponent)
        if (t.isIdentifier(typeAnnotation.typeName)) {
          const typeName = typeAnnotation.typeName.name;
          if (typeName === "FC" || typeName === "FunctionComponent") {
            return true;
          }
        }
        // Проверяем квалифицированное имя (React.FC, React.FunctionComponent)
        else if (t.isTSQualifiedName(typeAnnotation.typeName)) {
          const object = typeAnnotation.typeName.left.name;
          const property = typeAnnotation.typeName.right.name;
          if (
            object === "React" &&
            (property === "FC" || property === "FunctionComponent")
          ) {
            return true;
          }
        }
      }
    }

    // Имя компонента начинается с заглавной буквы - это хороший индикатор
    const componentName = path.node.id.name;
    if (componentName && componentName[0] === componentName[0].toUpperCase()) {
      // Проверка на наличие JSX в возвращаемом значении
      return containsJSX(path.get("init"));
    }
  }

  // Проверка обычных компонентов без экспорта
  // Проверка на тип компонента как FC или FunctionComponent
  if (path.node.id.typeAnnotation) {
    const typeAnnotation = path.node.id.typeAnnotation.typeAnnotation;
    if (t.isTSTypeReference(typeAnnotation)) {
      const typeName = typeAnnotation.typeName.name;
      if (
        typeName === "FC" ||
        typeName === "FunctionComponent" ||
        typeName === "React.FC" ||
        typeName === "React.FunctionComponent"
      ) {
        return true;
      }
    }
  }

  // Проверка на наличие JSX в возвращаемом значении
  return containsJSX(path.get("init"));
}

/**
 * Проверяет, является ли переменная функциональным компонентом React
 */
function isFunctionComponent(path) {
  if (
    !t.isVariableDeclarator(path.node) ||
    !t.isFunctionExpression(path.node.init)
  ) {
    return false;
  }

  // Проверка для export const Component: React.FC<Props> = function() {};
  if (
    path.parent &&
    path.parent.parent &&
    t.isExportNamedDeclaration(path.parent.parent)
  ) {
    // Если это экспортируемый компонент, проверяем наличие типизации
    if (path.node.id.typeAnnotation) {
      const typeAnnotation = path.node.id.typeAnnotation.typeAnnotation;
      if (t.isTSTypeReference(typeAnnotation)) {
        // Проверяем простое имя типа (FC, FunctionComponent)
        if (t.isIdentifier(typeAnnotation.typeName)) {
          const typeName = typeAnnotation.typeName.name;
          if (typeName === "FC" || typeName === "FunctionComponent") {
            return true;
          }
        }
        // Проверяем квалифицированное имя (React.FC, React.FunctionComponent)
        else if (t.isTSQualifiedName(typeAnnotation.typeName)) {
          const object = typeAnnotation.typeName.left.name;
          const property = typeAnnotation.typeName.right.name;
          if (
            object === "React" &&
            (property === "FC" || property === "FunctionComponent")
          ) {
            return true;
          }
        }
      }
    }

    // Имя компонента начинается с заглавной буквы - это хороший индикатор
    const componentName = path.node.id.name;
    if (componentName && componentName[0] === componentName[0].toUpperCase()) {
      // Проверка на наличие JSX в возвращаемом значении
      return containsJSX(path.get("init"));
    }
  }

  // Проверка на тип компонента как FC или FunctionComponent
  if (path.node.id.typeAnnotation) {
    const typeAnnotation = path.node.id.typeAnnotation.typeAnnotation;
    if (t.isTSTypeReference(typeAnnotation)) {
      const typeName = typeAnnotation.typeName.name;
      if (
        typeName === "FC" ||
        typeName === "FunctionComponent" ||
        typeName === "React.FC" ||
        typeName === "React.FunctionComponent"
      ) {
        return true;
      }
    }
  }

  // Проверка на наличие JSX в возвращаемом значении
  return containsJSX(path.get("init"));
}

/**
 * Проверяет, является ли объявление функции функциональным компонентом React
 */
function isFunctionDeclarationComponent(path) {
  if (!t.isFunctionDeclaration(path.node)) {
    return false;
  }

  // Проверка на тип возвращаемого значения, если он указан
  if (path.node.returnType) {
    const returnType = path.node.returnType.typeAnnotation;
    if (t.isTSTypeReference(returnType)) {
      const typeName = returnType.typeName?.name || "";
      if (
        typeName === "JSX.Element" ||
        typeName === "ReactElement" ||
        typeName === "React.ReactElement" ||
        typeName === "ReactNode" ||
        typeName === "React.ReactNode"
      ) {
        return true;
      }
    }
  }

  // Проверка имени функции - компоненты React обычно начинаются с заглавной буквы
  const funcName = path.node.id.name;
  if (funcName && funcName[0] === funcName[0].toUpperCase()) {
    // Проверка на наличие JSX в теле функции
    try {
      const body = path.get("body");
      if (body) {
        // Ищем return JSX в теле функции
        const hasJsx = body.traverse({
          ReturnStatement(returnPath) {
            const argument = returnPath.get("argument");
            if (
              argument &&
              (t.isJSXElement(argument.node) || t.isJSXFragment(argument.node))
            ) {
              return true;
            }
          },
        });

        if (hasJsx) return true;
      }
    } catch (error) {
      // Игнорируем ошибки при обходе
    }
  }

  return false;
}

/**
 * Проверяет, имеет ли компонент типизацию FunctionComponent<Props>
 */
function hasComponentReturnType(node) {
  if (!node.id || !node.id.typeAnnotation) return false;
  const typeAnnotation = node.id.typeAnnotation.typeAnnotation;

  if (!t.isTSTypeReference(typeAnnotation)) return false;

  // Проверка на простое имя типа (FC, FunctionComponent)
  if (
    typeAnnotation.typeName &&
    typeof typeAnnotation.typeName.name === "string"
  ) {
    const typeName = typeAnnotation.typeName.name;
    return typeName === "FC" || typeName === "FunctionComponent";
  }

  // Проверка на квалифицированное имя (React.FC, React.FunctionComponent)
  if (typeAnnotation.typeName && t.isTSQualifiedName(typeAnnotation.typeName)) {
    const object = typeAnnotation.typeName.left.name;
    const property = typeAnnotation.typeName.right.name;
    return (
      object === "React" &&
      (property === "FC" || property === "FunctionComponent")
    );
  }

  return false;
}

/**
 * Проверяет наличие JSX в теле функции
 */
function containsJSX(path) {
  try {
    if (!path || !path.node || !path.node.body) return false;

    let returnStatement = null;

    // Если тело функции - это выражение (стрелочная функция без {})
    if (t.isExpression(path.node.body)) {
      returnStatement = path.node.body;
    }

    // Если тело функции - это блок
    if (t.isBlockStatement(path.node.body)) {
      path.node.body.body.forEach((statement) => {
        if (t.isReturnStatement(statement)) {
          returnStatement = statement.argument;
        }
      });
    }

    return (
      returnStatement &&
      (t.isJSXElement(returnStatement) || t.isJSXFragment(returnStatement))
    );
  } catch (error) {
    return false;
  }
}

/**
 * Проверяет, является ли класс React-компонентом
 */
function isReactClassComponent(path) {
  if (!path || !path.node || !path.node.superClass) return false;

  const superClass = path.node.superClass;
  return (
    (t.isIdentifier(superClass) && superClass.name === "Component") ||
    (t.isMemberExpression(superClass) &&
      t.isIdentifier(superClass.object, { name: "React" }) &&
      t.isIdentifier(superClass.property, { name: "Component" }))
  );
}

module.exports = {
  isArrowFunctionComponent,
  isFunctionComponent,
  isFunctionDeclarationComponent,
  hasComponentReturnType,
  containsJSX,
  isReactClassComponent,
};
