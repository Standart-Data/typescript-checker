const t = require("@babel/types");
const { getTSType } = require("./types");
const { getCommonModifiers } = require("./common-utils");

/**
 * Парсит объявление интерфейса в React/Babel AST
 * @param {Object} path - путь к узлу TSInterfaceDeclaration
 * @param {Object} context - контекст для сохранения результатов
 * @param {boolean} isParentDeclared - флаг родительского declare
 * @param {boolean} isModuleMember - является ли членом модуля
 */
function parseSimpleInterfaceDeclaration(
  path,
  context,
  isParentDeclared = false,
  isModuleMember = false
) {
  const node = path.node;

  if (!node.id || node.id.type !== "Identifier") {
    return;
  }

  const typeName = node.id?.name;
  const modifiers = getCommonModifiers(
    node,
    path,
    isParentDeclared,
    isModuleMember
  );

  // Получаем наследование (extends)
  const extendsInterfaces = [];
  if (node.extends && node.extends.length > 0) {
    node.extends.forEach((ext) => {
      if (
        ext.type === "TSExpressionWithTypeArguments" &&
        ext.expression.type === "Identifier"
      ) {
        extendsInterfaces.push(ext.expression.name);
      }
    });
  }

  // Парсим свойства интерфейса
  const properties = {};
  const propertyDetails = []; // Новый массив для детальной информации о свойствах
  const methods = {};

  if (node.body && node.body.body) {
    node.body.body.forEach((member) => {
      if (member.type === "TSPropertySignature") {
        // Свойство интерфейса
        const propertyName = member.key.name || member.key.value || "unknown";
        let propertyType = "unknown";

        if (member.typeAnnotation) {
          propertyType = getTSType(member.typeAnnotation.typeAnnotation);
        }

        const isOptional = member.optional === true;

        // Сохраняем в старом формате для обратной совместимости
        properties[propertyName] = propertyType;

        // Сохраняем детальную информацию
        propertyDetails.push({
          name: propertyName,
          type: propertyType,
          optional: isOptional,
          typeString: isOptional
            ? `${propertyName}?: ${propertyType}`
            : `${propertyName}: ${propertyType}`,
        });
      } else if (member.type === "TSMethodSignature") {
        // Метод интерфейса
        const methodName = member.key.name || member.key.value || "unknown";

        // Парсим параметры метода
        const parameters = [];
        if (member.parameters) {
          member.parameters.forEach((param) => {
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
              isOptional: param.optional || false,
            });
          });
        }

        let returnType = "unknown";
        if (member.typeAnnotation) {
          returnType = getTSType(member.typeAnnotation);
        }

        methods[methodName] = {
          name: methodName,
          parameters: parameters,
          returnType: returnType,
          isOptional: member.optional || false,
        };
      } else if (member.type === "TSCallSignatureDeclaration") {
        // Call signature
        const parameters = [];
        if (member.parameters) {
          member.parameters.forEach((param) => {
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
              isOptional: param.optional || false,
            });
          });
        }

        let returnType = "unknown";
        if (member.typeAnnotation) {
          returnType = getTSType(member.typeAnnotation);
        }

        methods["__call__"] = {
          name: "__call__",
          parameters: parameters,
          returnType: returnType,
          isCallSignature: true,
        };
      }
    });
  }

  context.interfaces[typeName] = {
    name: typeName,
    extendsInterfaces: extendsInterfaces,
    properties: properties, // Старый формат для обратной совместимости
    propertyDetails: propertyDetails, // Новый детальный формат
    methods: methods,
    isExported: modifiers.isExported,
    isDeclared: modifiers.isDeclared,
    // Поля для согласованности с TypeScript парсером
    extends: extendsInterfaces.length > 0 ? extendsInterfaces : undefined,
    extendedBy: extendsInterfaces.length > 0 ? extendsInterfaces : undefined,
    // Поля для обратной совместимости
    types: Object.values(properties)
      .map((p) => p.type)
      .concat(Object.values(methods).map((m) => m.returnType)),
  };
}

module.exports = {
  parseSimpleInterfaceDeclaration,
};
