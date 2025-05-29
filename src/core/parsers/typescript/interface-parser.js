const ts = require("typescript");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объявление интерфейса
 * @param {ts.InterfaceDeclaration} node - нода интерфейса
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleInterfaceDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const interfaceName = node.name.text;
    const heritageClauses = node.heritageClauses;
    const extendedTypes = [];
    if (heritageClauses) {
      heritageClauses.forEach((clause) => {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          clause.types.forEach((typeNode) =>
            extendedTypes.push(
              checker.typeToString(checker.getTypeAtLocation(typeNode))
            )
          );
        }
      });
    }

    const modifiers = getCommonModifiers(
      node,
      isParentDeclared,
      isModuleMember
    );

    context.interfaces[interfaceName] = {
      name: interfaceName,
      properties: {},
      methods: {},
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
      extends: extendedTypes.length > 0 ? extendedTypes : undefined,
      extendedBy: extendedTypes.length > 0 ? extendedTypes : undefined,
    };

    node.members?.forEach((member) => {
      const memberName = member.name?.getText();
      if (!memberName) return;

      if (ts.isPropertySignature(member)) {
        context.interfaces[interfaceName].properties[memberName] = member.type
          ? checker.typeToString(checker.getTypeAtLocation(member.type))
          : "any";
      } else if (ts.isMethodSignature(member)) {
        const methodSignature = checker.getSignatureFromDeclaration(member);
        const interfaceMethodParams =
          member.parameters?.map((param) => ({
            name: param.name?.getText() || "",
            type: [
              param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
            ], // Обратная совместимость: type как массив строк
            optional: !!param.questionToken,
          })) || [];
        const interfaceMethodReturnType = methodSignature
          ? checker.typeToString(methodSignature.getReturnType())
          : "any";

        context.interfaces[interfaceName].methods[memberName] = {
          name: memberName,
          parameters: interfaceMethodParams.map((p) => ({
            // Новый формат для parameters
            name: p.name,
            type: p.type[0], // Извлекаем строку из массива
            optional: p.optional,
          })),
          params: interfaceMethodParams, // Обратная совместимость: старый формат с type как массивом
          returnType: interfaceMethodReturnType,
          returnResult: [interfaceMethodReturnType], // Обратная совместимость: returnResult как массив
        };
      }
    });
  }
}

module.exports = {
  parseSimpleInterfaceDeclaration,
};
