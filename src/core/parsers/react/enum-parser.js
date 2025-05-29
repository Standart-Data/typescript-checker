const t = require("@babel/types");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объявление enum в React/Babel AST
 * @param {Object} path - путь к узлу TSEnumDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleEnumDeclaration(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const enumName = node.id.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  // Парсим члены enum
  const members = [];
  if (node.members && node.members.length > 0) {
    node.members.forEach((member) => {
      if (member.type === "TSEnumMember" && member.id) {
        const memberName = member.id.name || member.id.value || "unknown";
        let memberValue = memberName; // По умолчанию значение равно имени

        if (member.initializer) {
          if (t.isStringLiteral(member.initializer)) {
            memberValue = `"${member.initializer.value}"`;
          } else if (t.isNumericLiteral(member.initializer)) {
            memberValue = member.initializer.value;
          } else {
            // Для других типов инициализаторов (например, вычисляемых)
            memberValue = member.initializer.toString();
          }
        }

        members.push({
          name: memberName,
          value: memberValue,
        });
      }
    });
  }

  context.enums[enumName] = {
    name: enumName,
    members: members,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    isConst: node.const || false,
    // Поля для обратной совместимости
    types: members.map((m) => typeof m.value),
  };
}

module.exports = {
  parseSimpleEnumDeclaration,
};
