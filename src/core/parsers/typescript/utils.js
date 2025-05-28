/**
 * Нормализует переводы строк в тексте к Windows-style (CRLF)
 * @param {string} text - исходный текст
 * @returns {string} текст с нормализованными переводами строк
 */
function normalizeLineEndings(text) {
  if (!text) return text;
  return text.replace(/\r?\n/g, "\r\n");
}

/**
 * Получает тип переменной
 * @param {ts.VariableDeclaration} declaration - декларация переменной
 * @param {ts.TypeChecker} checker - type checker
 * @returns {string} тип переменной
 */
function getVariableType(declaration, checker) {
  if (declaration.type) {
    return checker.typeToString(checker.getTypeAtLocation(declaration.type));
  }
  if (declaration.initializer) {
    const type = checker.getTypeAtLocation(declaration.initializer);
    return checker.typeToString(type);
  }
  return "any";
}

module.exports = {
  normalizeLineEndings,
  getVariableType,
};
