/**
 * Унифицированные утилиты для обработки модификаторов в React парсере (Babel AST)
 * Адаптер для common-utils.js под структуру Babel AST
 */

/**
 * Получает модификатор доступа из Babel AST
 * @param {Object} node - узел Babel AST
 * @returns {string} модификатор доступа: "private", "protected", "public"
 */
function getAccessModifier(node) {
  if (!node.accessibility) return "public";

  if (node.accessibility === "private") {
    return "private";
  }
  if (node.accessibility === "protected") {
    return "protected";
  }
  return "public";
}

/**
 * Преобразует новый формат модификатора в старый (для обратной совместимости)
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
 * Проверяет является ли элемент экспортированным
 * @param {Object} path - путь Babel AST
 * @param {boolean} isModuleMember - является ли членом модуля/namespace
 * @returns {boolean}
 */
function isExported(path, isModuleMember = false) {
  return (
    path.parent?.type === "ExportNamedDeclaration" ||
    path.parent?.parent?.type === "ExportNamedDeclaration" ||
    isModuleMember ||
    false
  );
}

/**
 * Проверяет наличие declare модификатора
 * @param {Object} node - узел Babel AST
 * @param {boolean} isParentDeclared - объявлен ли родительский элемент
 * @returns {boolean}
 */
function isDeclared(node, isParentDeclared = false) {
  // В Babel AST declare обычно обрабатывается на уровне файла
  // В React компонентах обычно не используется
  return isParentDeclared || node.declare || false;
}

/**
 * Проверяет наличие abstract модификатора
 * @param {Object} node - узел Babel AST
 * @returns {boolean}
 */
function isAbstract(node) {
  return node.abstract || false;
}

/**
 * Проверяет наличие static модификатора
 * @param {Object} node - узел Babel AST
 * @returns {boolean}
 */
function isStatic(node) {
  return node.static || false;
}

/**
 * Проверяет наличие readonly модификатора
 * @param {Object} node - узел Babel AST
 * @returns {boolean}
 */
function isReadonly(node) {
  return node.readonly || false;
}

/**
 * Проверяет наличие async модификатора
 * @param {Object} node - узел Babel AST
 * @returns {boolean}
 */
function isAsync(node) {
  return node.async || false;
}

/**
 * Проверяет наличие override модификатора
 * @param {Object} node - узел Babel AST
 * @returns {boolean}
 */
function isOverride(node) {
  return node.override || false;
}

/**
 * Проверяет наличие default модификатора
 * @param {Object} path - путь Babel AST
 * @returns {boolean}
 */
function isDefault(path) {
  return path.parent?.type === "ExportDefaultDeclaration" || false;
}

/**
 * Проверяет является ли генератором
 * @param {Object} node - узел Babel AST функции
 * @returns {boolean}
 */
function isGenerator(node) {
  return node.generator || false;
}

/**
 * Собирает все общие модификаторы для элемента в Babel AST
 * @param {Object} node - узел Babel AST
 * @param {Object} path - путь Babel AST
 * @param {boolean} isParentDeclared - объявлен ли родительский элемент
 * @param {boolean} isModuleMember - является ли членом модуля/namespace
 * @returns {Object} объект с модификаторами
 */
function getCommonModifiers(
  node,
  path,
  isParentDeclared = false,
  isModuleMember = false
) {
  return {
    isExported: isExported(path, isModuleMember),
    isDeclared: isDeclared(node, isParentDeclared),
    isAbstract: isAbstract(node),
    isStatic: isStatic(node),
    isReadonly: isReadonly(node),
    isAsync: isAsync(node),
    isOverride: isOverride(node),
    isDefault: isDefault(path),
    isGenerator: isGenerator(node),
    accessModifier: getAccessModifier(node),
  };
}

/**
 * Создает объект свойства в старом формате для React парсера
 * @param {string} propertyType - тип свойства
 * @param {string} accessModifier - модификатор доступа
 * @param {Object} member - член класса (для получения initializer)
 * @returns {Object} свойство в старом формате
 */
function createOldFormatProperty(propertyType, accessModifier, member) {
  return {
    types: [propertyType],
    modificator: getOldFormatModifier(accessModifier),
    value: member.value ? member.value.raw || member.value.value || "" : "",
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
  isGenerator,
  getCommonModifiers,
  createOldFormatProperty,
};
