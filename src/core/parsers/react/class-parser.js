const t = require("@babel/types");
const { getTSType, getType } = require("./types");
const {
  getCommonModifiers,
  getAccessModifier,
  createOldFormatProperty,
} = require("./common-utils");
const { parseDecorators, parseParamDecorators } = require("./decorators");

/**
 * Парсит объявление класса в React/Babel AST
 * @param {Object} path - путь к узлу ClassDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleClassDeclaration(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const className = node.id.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  // Получаем базовый класс
  let superClass = null;
  if (node.superClass) {
    if (node.superClass.type === "Identifier") {
      superClass = node.superClass.name;
    } else {
      superClass = node.superClass.toString();
    }
  }

  // Получаем интерфейсы (implements)
  const implementsInterfaces = [];
  if (node.implements && node.implements.length > 0) {
    node.implements.forEach((impl) => {
      if (
        impl.type === "TSExpressionWithTypeArguments" &&
        impl.expression.type === "Identifier"
      ) {
        implementsInterfaces.push(impl.expression.name);
      }
    });
  }

  // Парсим декораторы класса
  const decorators = parseDecorators(path);

  // Парсим члены класса
  const methods = {};
  const properties = {};
  const constructors = [];

  if (node.body && node.body.body) {
    node.body.body.forEach((member) => {
      if (member.type === "MethodDefinition") {
        const memberName = member.key.name || member.key.value || "unknown";
        const memberModifiers = getAccessModifier(member);

        if (member.kind === "constructor") {
          // Обработка конструктора
          const parameters = [];
          if (member.value.params) {
            member.value.params.forEach((param) => {
              let paramName = "unknown";
              let paramType = "unknown";

              if (param.type === "Identifier") {
                paramName = param.name;
                if (param.typeAnnotation) {
                  paramType = getTSType(param.typeAnnotation);
                }
              } else if (param.type === "AssignmentPattern") {
                if (param.left.type === "Identifier") {
                  paramName = param.left.name;
                  if (param.left.typeAnnotation) {
                    paramType = getTSType(param.left.typeAnnotation);
                  }
                }
              }

              parameters.push({
                name: paramName,
                type: paramType,
                isOptional: param.optional || false,
              });
            });
          }

          constructors.push({
            parameters: parameters,
            accessibility: memberModifiers.accessibility,
            isStatic: memberModifiers.isStatic,
          });
        } else {
          // Обработка методов
          const parameters = [];
          if (member.value.params) {
            member.value.params.forEach((param) => {
              let paramName = "unknown";
              let paramType = "unknown";

              if (param.type === "Identifier") {
                paramName = param.name;
                if (param.typeAnnotation) {
                  paramType = getTSType(param.typeAnnotation);
                }
              }

              parameters.push({
                name: paramName,
                type: paramType,
              });
            });
          }

          let returnType = "unknown";
          if (member.value.returnType) {
            returnType = getTSType(member.value.returnType);
          }

          // Создаем путь для метода чтобы парсить декораторы
          const methodPath = {
            node: member,
          };

          methods[memberName] = {
            name: memberName,
            parameters: parameters,
            returnType: returnType,
            accessibility: memberModifiers.accessibility,
            isStatic: memberModifiers.isStatic,
            isAsync: member.value.async || false,
            isGenerator: member.value.generator || false,
            decorators: parseDecorators(methodPath),
            paramDecorators: parseParamDecorators(methodPath),
          };
        }
      } else if (
        member.type === "PropertyDefinition" ||
        member.type === "ClassProperty"
      ) {
        // Обработка свойств класса
        const propertyName = member.key.name || member.key.value || "unknown";
        const propertyModifiers = getAccessModifier(member);

        let propertyType = "unknown";
        if (member.typeAnnotation) {
          propertyType = getTSType(member.typeAnnotation);
        } else if (member.value) {
          propertyType = getType(member.value);
        }

        // Создаем путь для свойства чтобы парсить декораторы
        const propertyPath = {
          node: member,
        };

        properties[propertyName] = {
          name: propertyName,
          type: propertyType,
          accessibility: propertyModifiers.accessibility,
          isStatic: propertyModifiers.isStatic,
          isReadonly: member.readonly || false,
          hasInitializer: !!member.value,
          decorators: parseDecorators(propertyPath),
        };
      }
    });
  }

  context.classes[className] = {
    name: className,
    superClass: superClass,
    implementsInterfaces: implementsInterfaces,
    methods: methods,
    properties: properties,
    constructors: constructors,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    isAbstract: false, // Babel не поддерживает abstract классы напрямую
    decorators: decorators,
    // Поля для обратной совместимости
    types: Object.values(methods)
      .map((m) => m.returnType)
      .concat(Object.values(properties).map((p) => p.type)),
  };
}

module.exports = {
  parseSimpleClassDeclaration,
};
