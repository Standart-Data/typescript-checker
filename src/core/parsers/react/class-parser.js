const t = require("@babel/types");
const { getTSType, getType } = require("./types");
const {
  getCommonModifiers,
  getAccessModifier,
  createOldFormatProperty,
} = require("./common-utils");
const {
  parseDecorators,
  parseParamDecorators,
  parseMethodDecorators,
  parsePropertyDecorators,
  parseAccessorDecorators,
  getNodeText,
} = require("./decorators");

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
  let extendedClasses = [];
  if (node.superClass) {
    if (node.superClass.type === "Identifier") {
      superClass = node.superClass.name;
      extendedClasses = [node.superClass.name];
    } else {
      superClass = getNodeText(node.superClass);
      extendedClasses = [superClass];
    }
  }

  // Получаем интерфейсы (implements)
  const implementsInterfaces = [];
  const implementedInterfaces = [];
  if (node.implements && node.implements.length > 0) {
    node.implements.forEach((impl) => {
      if (
        impl.type === "TSExpressionWithTypeArguments" &&
        impl.expression.type === "Identifier"
      ) {
        const interfaceName = impl.expression.name;
        implementsInterfaces.push(interfaceName);
        implementedInterfaces.push(interfaceName);
      }
    });
  }

  // Парсим декораторы класса
  const decorators = parseDecorators(path);

  // Парсим члены класса
  const methods = {};
  const properties = {};
  const constructors = [];

  // Старый формат для обратной совместимости
  const oldFormatMembers = {};

  if (node.body && node.body.body) {
    node.body.body.forEach((member) => {
      if (member.type === "MethodDefinition") {
        const memberName = member.key.name || member.key.value || "unknown";
        const memberModifiers = getAccessModifier(member);

        if (member.kind === "constructor") {
          // Обработка конструктора
          const parameters = [];
          const params = []; // Старый формат

          if (member.value.params) {
            member.value.params.forEach((param, index) => {
              let paramName = "unknown";
              let paramType = "unknown";
              let isOptional = false;

              if (param.type === "Identifier") {
                paramName = param.name;
                if (param.typeAnnotation) {
                  paramType = getTSType(param.typeAnnotation);
                }
                isOptional = param.optional || false;
              } else if (param.type === "AssignmentPattern") {
                if (param.left.type === "Identifier") {
                  paramName = param.left.name;
                  if (param.left.typeAnnotation) {
                    paramType = getTSType(param.left.typeAnnotation);
                  }
                }
                isOptional = true;
              }

              // Новый формат
              parameters.push({
                name: paramName,
                type: paramType,
                isOptional: isOptional,
              });

              // Старый формат
              const paramObj = {};
              paramObj[paramName] = {
                types: [paramType],
                optional: isOptional,
              };
              params.push(paramObj);
            });
          }

          // Создаем путь для конструктора чтобы парсить декораторы параметров
          const constructorPath = {
            node: member.value,
          };

          const constructorBody = member.value.body
            ? getNodeText(member.value.body)
            : "";

          constructors.push({
            parameters: parameters,
            params: params, // Старый формат
            accessibility: memberModifiers.accessibility,
            isStatic: memberModifiers.isStatic,
            paramDecorators: parseParamDecorators(constructorPath),
            body: constructorBody,
          });

          // Добавляем в старый формат
          oldFormatMembers.constructor = {
            params: params,
            body: constructorBody,
            paramDecorators: parseParamDecorators(constructorPath),
          };
        } else if (member.kind === "get" || member.kind === "set") {
          // Обработка геттеров и сеттеров
          const accessorName = memberName;
          let returnType = "unknown";

          if (member.value.returnType) {
            returnType = getTSType(member.value.returnType);
          }

          // Создаем путь для аксессора
          const accessorPath = {
            node: member,
          };

          const accessorBody = member.value.body
            ? getNodeText(member.value.body)
            : "";

          const accessorInfo = {
            name: accessorName,
            kind: member.kind, // "get" или "set"
            returnType: returnType,
            accessibility: memberModifiers.accessibility,
            isStatic: memberModifiers.isStatic,
            decorators: parseAccessorDecorators(accessorPath),
            body: accessorBody,
          };

          // Добавляем параметры для setter
          if (
            member.kind === "set" &&
            member.value.params &&
            member.value.params.length > 0
          ) {
            const param = member.value.params[0];
            accessorInfo.parameters = [
              {
                name: param.name || "value",
                type: param.typeAnnotation
                  ? getTSType(param.typeAnnotation)
                  : "unknown",
              },
            ];
          }

          // В новом формате добавляем как метод
          methods[`${member.kind}_${accessorName}`] = accessorInfo;

          // В старом формате также добавляем
          oldFormatMembers[`${member.kind}_${accessorName}`] = accessorInfo;
        } else {
          // Обработка обычных методов
          const parameters = [];
          const params = []; // Старый формат

          if (member.value.params) {
            member.value.params.forEach((param, index) => {
              let paramName = "unknown";
              let paramType = "unknown";
              let isOptional = false;

              if (param.type === "Identifier") {
                paramName = param.name;
                if (param.typeAnnotation) {
                  paramType = getTSType(param.typeAnnotation);
                }
                isOptional = param.optional || false;
              }

              // Новый формат
              parameters.push({
                name: paramName,
                type: paramType,
                isOptional: isOptional,
              });

              // Старый формат
              const paramObj = {};
              paramObj[paramName] = {
                types: [paramType],
                optional: isOptional,
              };
              params.push(paramObj);
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

          const methodBody = member.value.body
            ? getNodeText(member.value.body)
            : "";

          const methodInfo = {
            name: memberName,
            parameters: parameters,
            params: params, // Старый формат для совместимости
            returnType: returnType,
            returnResult: [returnType], // Старый формат
            accessModifier:
              memberModifiers.accessibility === "private"
                ? "private"
                : memberModifiers.accessibility === "protected"
                ? "protected"
                : "public",
            accessibility: memberModifiers.accessibility,
            isStatic: memberModifiers.isStatic,
            isAsync: member.value.async || false,
            isGenerator: member.value.generator || false,
            decorators: parseMethodDecorators(methodPath),
            paramDecorators: parseParamDecorators({ node: member.value }),
            body: methodBody,
          };

          methods[memberName] = methodInfo;

          // Добавляем в старый формат
          oldFormatMembers[memberName] = methodInfo;
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

        const initializer = member.value ? getNodeText(member.value) : null;

        const propertyInfo = {
          name: propertyName,
          type: propertyType,
          accessModifier:
            propertyModifiers.accessibility === "private"
              ? "private"
              : propertyModifiers.accessibility === "protected"
              ? "protected"
              : "public",
          accessibility: propertyModifiers.accessibility,
          isStatic: propertyModifiers.isStatic,
          isReadonly: member.readonly || false,
          hasInitializer: !!member.value,
          initializer: initializer,
          decorators: parsePropertyDecorators(propertyPath),
        };

        properties[propertyName] = propertyInfo;

        // Добавляем в старый формат для обратной совместимости
        oldFormatMembers[propertyName] = createOldFormatProperty(
          propertyName,
          propertyType,
          propertyModifiers,
          member.value
        );
      }
    });
  }

  const classInfo = {
    name: className,
    superClass: superClass,
    extends: extendedClasses, // Новый формат
    extendedClasses: extendedClasses, // Альтернативный формат
    implementsInterfaces: implementsInterfaces,
    implements: implementedInterfaces, // Альтернативный формат
    methods: methods,
    properties: properties,
    constructors: constructors,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    isAbstract: node.abstract || false,
    decorators: decorators,
    // Поля для обратной совместимости
    ...oldFormatMembers,
    types: Object.values(methods)
      .map((m) => m.returnType)
      .concat(Object.values(properties).map((p) => p.type)),
  };

  context.classes[className] = classInfo;
}

module.exports = {
  parseSimpleClassDeclaration,
};
