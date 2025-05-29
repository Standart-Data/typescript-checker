const ts = require("typescript");
const { parseDecorators } = require("./decorators");
const {
  getCommonModifiers,
  createOldFormatConstructorParam,
  createOldFormatProperty,
} = require("./common-utils");
const { normalizeLineEndings } = require("./utils");

/**
 * Парсит объявление класса
 * @param {ts.ClassDeclaration} node - нода класса
 * @param {Object} context - контекст для сохранения результатов
 * @param {ts.TypeChecker} checker - type checker
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleClassDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const className = node.name.text;
    const decorators = parseDecorators(node);
    const heritageClauses = node.heritageClauses;
    const extendedTypes = [];
    const implementedTypes = [];

    if (heritageClauses) {
      heritageClauses.forEach((clause) => {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          clause.types.forEach((typeNode) =>
            extendedTypes.push(
              checker.typeToString(checker.getTypeAtLocation(typeNode))
            )
          );
        } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          clause.types.forEach((typeNode) =>
            implementedTypes.push(
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
    const classMembers = {};

    const extendsClause = node.heritageClauses?.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
    );
    const extendedClasses = extendsClause
      ? extendsClause.types.map((type) => type.getText())
      : [];

    context.classes[className] = {
      name: className,
      properties: {},
      methods: {},
      isExported: modifiers.isExported,
      isDeclared: modifiers.isDeclared,
      isAbstract: modifiers.isAbstract,
      decorators: decorators.length > 0 ? decorators : undefined,
      extends: extendedTypes.length > 0 ? extendedTypes : undefined,
      implements: implementedTypes.length > 0 ? implementedTypes : undefined,
      // Добавляем обратную совместимость с расширенными классами в старом формате
      ...(extendedClasses.length > 0 ? { extendedClasses } : {}),
    };

    // Обработка конструкторов в старом стиле для обратной совместимости
    const constructors = node.members.filter((member) =>
      ts.isConstructorDeclaration(member)
    );

    if (constructors.length > 0) {
      constructors.forEach((constructor, index) => {
        const constructorParams = constructor.parameters.map((param) =>
          createOldFormatConstructorParam(param, checker)
        );

        if (constructor.body) {
          // Основная реализация конструктора
          classMembers["constructor"] = {
            params: constructorParams,
            body: normalizeLineEndings(constructor.body.getText()),
          };
          context.classes[className]["constructor"] = {
            params: constructorParams,
            body: normalizeLineEndings(constructor.body.getText()),
          };
        } else {
          // Сигнатура конструктора (перегрузка)
          const signatureName = `constructorSignature${index}`;
          classMembers[signatureName] = {
            params: constructorParams,
          };
          context.classes[className][signatureName] = {
            params: constructorParams,
          };
        }
      });
    }

    node.members?.forEach((member) => {
      const memberName = member.name?.getText();
      if (!memberName) return;
      const memberDecorators = parseDecorators(member);

      if (ts.isPropertyDeclaration(member)) {
        const memberModifiers = getCommonModifiers(member);

        const propertyType = member.type
          ? checker.typeToString(checker.getTypeAtLocation(member.type))
          : member.initializer
          ? checker.typeToString(checker.getTypeAtLocation(member.initializer))
          : "any";

        context.classes[className].properties[memberName] = {
          name: memberName,
          type: propertyType,
          isStatic: memberModifiers.isStatic,
          isReadonly: memberModifiers.isReadonly,
          accessModifier: memberModifiers.accessModifier,
          isAbstract: memberModifiers.isAbstract,
          isOverride: memberModifiers.isOverride,
          decorators:
            memberDecorators.length > 0 ? memberDecorators : undefined,
          initializer: member.initializer?.getText(),
        };

        // Добавляем обратную совместимость - свойства прямо в класс
        context.classes[className][memberName] = createOldFormatProperty(
          propertyType,
          memberModifiers.accessModifier,
          member,
          memberModifiers.isReadonly
        );
      } else if (ts.isMethodDeclaration(member)) {
        const memberModifiers = getCommonModifiers(member);

        const methodSignature = checker.getSignatureFromDeclaration(member);
        const methodParams =
          member.parameters?.map((param) => ({
            name: param.name?.getText() || "",
            type: [
              param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
            ], // Обратная совместимость: type как массив строк
            optional: !!param.questionToken,
          })) || [];
        const methodReturnType = methodSignature
          ? checker.typeToString(methodSignature.getReturnType())
          : "any";

        context.classes[className].methods[memberName] = {
          name: memberName,
          parameters: methodParams.map((p) => ({
            // Новый формат для parameters
            name: p.name,
            type: p.type[0], // Извлекаем строку из массива
            optional: p.optional,
          })),
          params: methodParams, // Обратная совместимость: старый формат с type как массивом
          returnType: methodReturnType,
          returnResult: [methodReturnType], // Обратная совместимость: returnResult как массив
          ...memberModifiers,
          decorators:
            memberDecorators.length > 0 ? memberDecorators : undefined,
          body: member.body
            ? normalizeLineEndings(member.body.getText())
            : undefined,
        };

        classMembers[memberName] = {
          body: member.body
            ? normalizeLineEndings(member.body.getText())
            : undefined,
        };

        // Добавляем обратную совместимость - методы прямо в класс
        context.classes[className][memberName] = {
          body: member.body
            ? normalizeLineEndings(member.body.getText())
            : undefined,
        };
      }
    });
  }
}

module.exports = {
  parseSimpleClassDeclaration,
};
