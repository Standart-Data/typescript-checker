const ts = require("typescript");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объявление enum
 * @param {ts.EnumDeclaration} node - нода enum'а
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleEnumDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const enumName = node.name.text;
    const modifiers = getCommonModifiers(
      node,
      isParentDeclared,
      isModuleMember
    );

    context.enums[enumName] = {
      name: enumName,
      isConst: modifiers.isConst,
      members:
        node.members?.map((member) => {
          const memberName = member.name.getText();
          let memberValue = checker.getConstantValue(member);
          if (typeof memberValue === "string") {
            memberValue = `"${memberValue}"`; // Keep quotes for string enum values
          }
          return { name: memberName, value: memberValue };
        }) || [],
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
    };
  }
}

module.exports = {
  parseSimpleEnumDeclaration,
};
