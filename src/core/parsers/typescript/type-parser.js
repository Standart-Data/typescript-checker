const ts = require("typescript");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объявление типа (type alias)
 * @param {ts.TypeAliasDeclaration} node - нода типа
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleTypeAliasDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const typeName = node.name.text;

    // Для union типов берём исходное текстовое представление
    let typeDefinition;
    if (ts.isUnionTypeNode(node.type)) {
      typeDefinition = node.type.getText();
    } else if (ts.isTypeReferenceNode(node.type)) {
      // Для utility типов (Pick, Omit, etc.) берём исходное текстовое представление
      typeDefinition = node.type.getText();
    } else {
      typeDefinition = checker.typeToString(
        checker.getTypeAtLocation(node.type)
      );
    }

    const modifiers = getCommonModifiers(
      node,
      isParentDeclared,
      isModuleMember
    );

    // Базовая информация о типе
    const typeInfo = {
      name: typeName,
      definition: typeDefinition,
      value: typeDefinition,
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
    };

    // Детальный анализ для гибридных типов (функция + свойства)
    if (node.type && ts.isTypeLiteralNode(node.type)) {
      const callSignatures = [];
      const properties = {};

      node.type.members.forEach((member) => {
        if (ts.isCallSignatureDeclaration(member)) {
          // Обрабатываем call signatures: (name?: string): string;
          const params =
            member.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: [
                param.type
                  ? checker.typeToString(checker.getTypeAtLocation(param.type))
                  : "any",
              ], // Обратная совместимость: type как массив строк
              optional: !!param.questionToken,
            })) || [];

          const returnType = member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : "any";

          callSignatures.push({
            params,
            returnType,
          });
        } else if (
          ts.isPropertySignature(member) ||
          ts.isMethodSignature(member)
        ) {
          // Обрабатываем свойства и методы
          const propName = member.name?.getText();
          if (propName) {
            if (ts.isMethodSignature(member)) {
              // Метод: setDefaultName(newName: string): void;
              const methodParams =
                member.parameters?.map((param) => ({
                  name: param.name?.getText() || "",
                  type: [
                    param.type
                      ? checker.typeToString(
                          checker.getTypeAtLocation(param.type)
                        )
                      : "any",
                  ], // Обратная совместимость: type как массив строк
                })) || [];

              const methodReturnType = member.type
                ? checker.typeToString(checker.getTypeAtLocation(member.type))
                : "void";

              const paramString = methodParams
                .map((p) => `${p.name}: ${p.type[0]}`) // Используем первый элемент массива для строкового представления
                .join(", ");
              properties[propName] = `(${paramString}) => ${methodReturnType}`;
            } else {
              // Свойство: defaultName: string;
              const propType = member.type
                ? checker.typeToString(checker.getTypeAtLocation(member.type))
                : "any";
              properties[propName] = propType;
            }
          }
        }
      });

      // Если есть call signatures, это функциональный тип
      if (callSignatures.length > 0) {
        typeInfo.type = "function";
        typeInfo.properties = properties;

        // Добавляем информацию о параметрах из первой call signature
        if (callSignatures[0].params.length > 0) {
          typeInfo.params = callSignatures[0].params;
        }
      }
    }

    context.types[typeName] = typeInfo;
  }
}

module.exports = {
  parseSimpleTypeAliasDeclaration,
};
