const ts = require("typescript");

/**
 * Унифицированная функция для определения модификаторов доступа
 * @param {ts.Node} node - нода с модификаторами
 * @returns {string} модификатор доступа: "private", "protected", "public"
 */
function getAccessModifier(node) {
  if (!node.modifiers) return "public";

  if (node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword)) {
    return "private";
  }
  if (
    node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.ProtectedKeyword)
  ) {
    return "protected";
  }
  return "public";
}

/**
 * Преобразует новый формат модификатора в старый
 * @param {string} accessModifier - модификатор в новом формате
 * @returns {string} модификатор в старом формате
 */
function getOldFormatModifier(accessModifier) {
  switch (accessModifier) {
    case "private":
      return "private";
    case "protected":
      return "protected";
    case "public":
    default:
      return "opened";
  }
}

/**
 * Проверяет наличие модификатора экспорта
 * @param {ts.Node} node - нода
 * @param {boolean} isModuleMember - является ли членом модуля/namespace
 * @returns {boolean}
 */
function isExported(node, isModuleMember = false) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) ||
    isModuleMember ||
    false
  );
}

/**
 * Проверяет наличие модификатора declare
 * @param {ts.Node} node - нода
 * @param {boolean} isParentDeclared - объявлен ли родительский элемент
 * @returns {boolean}
 */
function isDeclared(node, isParentDeclared = false) {
  return (
    isParentDeclared ||
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DeclareKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора abstract
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isAbstract(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AbstractKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора static
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isStatic(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора readonly
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isReadonly(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора async
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isAsync(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора override
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isOverride(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.OverrideKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора default
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isDefault(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DefaultKeyword) ||
    false
  );
}

/**
 * Проверяет наличие модификатора const (для enum)
 * @param {ts.Node} node - нода
 * @returns {boolean}
 */
function isConst(node) {
  return (
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ConstKeyword) ||
    false
  );
}

/**
 * Проверяет является ли функция генератором
 * @param {ts.Node} node - нода функции
 * @returns {boolean}
 */
function isGenerator(node) {
  return node.asteriskToken !== undefined;
}

/**
 * Собирает все общие модификаторы для элемента
 * @param {ts.Node} node - нода
 * @param {boolean} isParentDeclared - объявлен ли родительский элемент
 * @param {boolean} isModuleMember - является ли членом модуля/namespace
 * @returns {Object} объект с модификаторами
 */
function getCommonModifiers(
  node,
  isParentDeclared = false,
  isModuleMember = false
) {
  return {
    isExported: isExported(node, isModuleMember),
    isDeclared: isDeclared(node, isParentDeclared),
    isAbstract: isAbstract(node),
    isStatic: isStatic(node),
    isReadonly: isReadonly(node),
    isAsync: isAsync(node),
    isOverride: isOverride(node),
    isDefault: isDefault(node),
    isConst: isConst(node),
    isGenerator: isGenerator(node),
    accessModifier: getAccessModifier(node),
  };
}

/**
 * Получает тип переменной из declaration
 * @param {ts.VariableDeclaration} declaration - объявление переменной
 * @param {ts.TypeChecker} checker - type checker
 * @returns {string} тип переменной
 */
function getVariableType(declaration, checker) {
  if (declaration.type) {
    return checker.typeToString(checker.getTypeAtLocation(declaration.type));
  }
  if (declaration.initializer) {
    return checker.typeToString(
      checker.getTypeAtLocation(declaration.initializer)
    );
  }
  return "any";
}

/**
 * Получает тип объявления переменной (var/let/const)
 * @param {ts.VariableStatement} node - statement с переменными
 * @returns {string} тип объявления
 */
function getDeclarationType(node) {
  const flags = node.declarationList.flags;
  if (flags & ts.NodeFlags.Const) return "const";
  if (flags & ts.NodeFlags.Let) return "let";
  return "var";
}

/**
 * Проверяет является ли переменная константой
 * @param {ts.VariableStatement} node - statement с переменными
 * @returns {boolean}
 */
function isConstVariable(node) {
  return (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
}

/**
 * Создает объект параметра в старом формате для конструкторов
 * @param {ts.ParameterDeclaration} param - параметр
 * @param {ts.TypeChecker} checker - type checker
 * @returns {Object} параметр в старом формате
 */
function createOldFormatConstructorParam(param, checker) {
  const paramName = param.name.getText();
  const paramType = param.type
    ? checker.typeToString(checker.getTypeAtLocation(param.type))
    : "any";
  const defaultValue = param.initializer
    ? param.initializer.getText().trim().replace(/['"]+/g, "")
    : null;

  return { [paramName]: { types: [paramType], defaultValue } };
}

/**
 * Создает объект свойства в старом формате
 * @param {string} propertyType - тип свойства
 * @param {string} accessModifier - модификатор доступа
 * @param {ts.Node} member - член класса (для получения initializer)
 * @returns {Object} свойство в старом формате
 */
function createOldFormatProperty(propertyType, accessModifier, member) {
  return {
    types: [propertyType],
    modificator: getOldFormatModifier(accessModifier),
    value: member.initializer
      ? member.initializer.getText().replace(/['"]/g, "")
      : "",
  };
}

module.exports = {
  getAccessModifier,
  getOldFormatModifier,
  isExported,
  isDeclared,
  isAbstract,
  isStatic,
  isReadonly,
  isAsync,
  isOverride,
  isDefault,
  isConst,
  isGenerator,
  getCommonModifiers,
  getVariableType,
  getDeclarationType,
  isConstVariable,
  createOldFormatConstructorParam,
  createOldFormatProperty,
};
