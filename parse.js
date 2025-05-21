const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const ts = require("typescript");

function createTempFileWithContent(content) {
  const randomFileName = path.join(
    os.tmpdir(),
    `temp-${crypto.randomBytes(8).toString("hex")}.ts`
  );
  fs.writeFileSync(randomFileName, content);
  return randomFileName;
}

function parseTypeScriptString(tsString) {
  const tempFilename = createTempFileWithContent(tsString);

  return tempFilename;
}

function readTsFiles(filePaths) {
  try {
    const allVariables = {
      variables: {},
      interfaces: {},
      functions: {},
      types: {},
      enums: {},
      classes: {},
      namespaces: {},
    };

    function parseObject(node, checker) {
      const obj = {};
      ts.forEachChild(node, (property) => {
        const name = property.name
          ? property.name.getText().replace(/['"]+/g, "")
          : undefined;
        if (name) {
          const propType = checker.getTypeAtLocation(property);
          const type = checker.typeToString(propType);
          if (ts.isObjectLiteralExpression(property.initializer)) {
            obj[name] = {
              types: ["object"],
              value: parseObject(property.initializer, checker),
            };
          } else if (ts.isArrayLiteralExpression(property.initializer)) {
            obj[name] = {
              types: ["array"],
              value: property.initializer.elements.map((el) =>
                el.getText().replace(/['"]+/g, "")
              ),
            };
          } else {
            obj[name] = {
              types: [type],
              value: property.initializer
                ? property.initializer.getText().replace(/['"]+/g, "")
                : null,
            };
          }
        }
      });
      return obj;
    }

    function parseType(node) {
      const type = { type: "simple" };
      if (ts.isTypeLiteralNode(node)) {
        // Проверяем наличие сигнатуры вызова функции
        const callSignature = node.members.find((m) =>
          ts.isCallSignatureDeclaration(m)
        );

        if (callSignature) {
          // Обрабатываем как функциональный тип
          type.type = "function";
          type.params = callSignature.parameters.map((param) => ({
            name: param.name?.getText() || "unnamed",
            type: param.type?.getText().trim() || "any",
            optional: !!param.questionToken,
          }));

          type.returnType = callSignature.type?.getText().trim() || "void";

          // Добавляем остальные свойства объекта как дополнительные поля
          type.properties = {};
          node.members.forEach((member) => {
            if (!ts.isCallSignatureDeclaration(member) && member.name) {
              const name = member.name.getText();
              const memberType = member.type?.getText().trim() || "any";
              type.properties[name] = memberType;
            }
          });
        } else {
          // Обычный объект
          type.type = "object";
          type.properties = {};
          node.members.forEach((member) => {
            const name = member.name?.getText();
            const memberType = member.type?.getText().trim();
            if (name && memberType) {
              type.properties[name] = memberType;
            }
          });
        }
      } else if (ts.isUnionTypeNode(node)) {
        type.type = "combined";
        type.possibleTypes = node.types.map((t) => parseType(t));
      } else if (ts.isFunctionTypeNode(node)) {
        // Обработка FunctionTypeNode для стрелочных функций
        type.type = "function";
        type.params = node.parameters.map((param) => ({
          name: param.name.getText(),
          type: param.type ? param.type.getText().trim() : "any",
          optional: !!param.questionToken, // Добавляем флаг optional
        }));
        type.returnType = node.type?.getText().trim() || "void";
      } else {
        type.value = node.getText().trim();
      }
      return type;
    }

    function getReturnTypeOfExpression(expression, checker) {
      const type = checker.getTypeAtLocation(expression);
      return checker.typeToString(type);
    }

    function isExported(node) {
      return (
          node.modifiers &&
          node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      );
    }

    function parseNode(node, checker, context = allVariables) {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
          node.declarationList.declarations.forEach((declaration) => {
            if (ts.isArrayBindingPattern(declaration.name)) {
              // Обработка деструктуризации массивов
              if (
                declaration.type &&
                declaration.type.kind === ts.SyntaxKind.TupleType
              ) {
                const elementTypes = declaration.type.elements.map((type) =>
                  type.getText().trim()
                );
                declaration.name.elements.forEach((element, index) => {
                  const elementName = element.name.getText();
                  const elementType = elementTypes[index];
                  context.variables[elementName] = {
                    types: [elementType],
                    from: declaration.initializer.getText().trim(),
                  };
                });
              }
            } else {
              const name = declaration.name.getText();
              let type = "any";

              // Если у переменной указан тип, используем его
              if (declaration.type) {
                type = checker.typeToString(
                  checker.getTypeAtLocation(declaration.type)
                );
              }

              const initializer = declaration.initializer
                ? declaration.initializer.getText().trim().replace(/['"]+/g, "")
                : null;

              // Если переменная является функцией
              if (
                ts.isArrowFunction(declaration.initializer) ||
                ts.isFunctionExpression(declaration.initializer)
              ) {
                const funcType = checker.getTypeAtLocation(declaration);
                const returnType = checker.getReturnTypeOfSignature(
                  checker.getSignaturesOfType(
                    funcType,
                    ts.SignatureKind.Call
                  )[0]
                );
                const returnTypeString = checker.typeToString(returnType);
                const params = declaration.initializer.parameters.map(
                  (param) => ({
                    name: param.name.getText(),
                    type: param.type ? param.type.getText() : "any",
                  })
                );
                const body = declaration.initializer.body.getText();

                // Сохраняем переменную как функцию
                context.functions[name] = {
                  types: [type], // Используем тип из объявления (Greeting)
                  params,
                  returnResult: [returnTypeString],
                  body,
                  isExported: isExported(node), // Добавляем флаг экспорта
                };
              } else if (
                initializer &&
                ts.isObjectLiteralExpression(declaration.initializer)
              ) {
                // Если переменная инициализирована объектом
                context.variables[name] = {
                  types: [type],
                  value: parseObject(declaration.initializer, checker),
                  isExported: isExported(node), // Добавляем флаг экспорта
                };
              } else if (
                initializer &&
                ts.isCallExpression(declaration.initializer)
              ) {
                // Если переменная инициализирована вызовом функции
                const returnTypeString = getReturnTypeOfExpression(
                  declaration.initializer,
                  checker
                );
                context.variables[name] = {
                  types: [returnTypeString],
                  value: initializer,
                  isExported: isExported(node), // Добавляем флаг экспорта
                };
              } else {
                // Обычная переменная
                context.variables[name] = {
                  types: [type],
                  value: initializer,
                  isExported: isExported(node), // Добавляем флаг экспорта
                };
              }
            }
          });
          break;
        case ts.SyntaxKind.InterfaceDeclaration:
          const interfaceName = node.name.getText();
          const properties = {};
          node.members.forEach((member) => {
            const name = member.name.getText();
            const memberType = member.type.getText().trim();
            properties[name] = memberType;
          });

          const extendedClause = node.heritageClauses?.find(
            (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
          );
          const extendedBy = extendedClause
            ? extendedClause.types.map((type) => type.getText())
            : [];

          context.interfaces[interfaceName] = {
            properties,
            extendedBy, // Добавляем поле extendedBy
            isExported: isExported(node), // Добавляем флаг экспорта
          };
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          const functionName = node.name.getText();
          const existingFunction = context.functions[functionName] || {};

          // Парсинг параметров
          const params = node.parameters.map((param) => ({
            name: param.name.getText(),
            type: param.type ? param.type.getText().trim() : "any",
            optional: !!param.questionToken,
            defaultValue: param.initializer
              ? param.initializer.getText().replace(/['"]+/g, "")
              : null,
          }));

          // Определение возвращаемого типа
          let returnTypeString;
          if (node.type) {
            returnTypeString = node.type.getText().trim();
          } else {
            const signature = checker.getSignatureFromDeclaration(node);
            returnTypeString = signature
              ? checker.typeToString(signature.getReturnType())
              : "void";
          }

          // Generics и тело функции
          const genericsTypes = node.typeParameters
            ? node.typeParameters.map((tp) => tp.getText().trim())
            : [];
          const body = node.body?.getText();

          if (node.body) {
            // Основная реализация функции
            existingFunction.params = params;
            existingFunction.returnResult = [returnTypeString];
            existingFunction.genericsTypes = genericsTypes;
            existingFunction.body = body;
            existingFunction.types = ["function"];
            existingFunction.isExported = isExported(node); // Добавляем флаг экспорта
          } else {
            // Добавление перегрузки
            const overloadCount = Object.keys(existingFunction).filter((key) =>
              key.startsWith("overload")
            ).length;
            const overloadKey = `overload${overloadCount}`;
            existingFunction[overloadKey] = {
              params,
              returnResult: [returnTypeString],
              genericsTypes,
              body: null,
              isExported: isExported(node), // Добавляем флаг экспорта
            };
          }

          context.functions[functionName] = existingFunction;
          break;
          break;
        case ts.SyntaxKind.TypeAliasDeclaration:
          const typeName = node.name.getText();
          const aliasType = parseType(node.type);
          context.types[typeName] = aliasType;
          break;
        case ts.SyntaxKind.EnumDeclaration:
          const enumName = node.name.getText();
          const members = node.members.map((member) => member.name.getText());
          allVariables.enums[enumName] = members;
          break;
        case ts.SyntaxKind.ClassDeclaration:
          const className = node.name.getText();
          const classMembers = {};

          const extendsClause = node.heritageClauses?.find(
            (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
          );
          const extendedClasses = extendsClause
            ? extendsClause.types.map((type) => type.getText())
            : [];

          // Обработка конструкторов
          const constructors = node.members.filter((member) =>
            ts.isConstructorDeclaration(member)
          );

          if (constructors.length > 0) {
            constructors.forEach((constructor, index) => {
              const constructorParams = constructor.parameters.map((param) => {
                const paramName = param.name.getText();
                const paramType = param.type
                  ? param.type.getText().trim()
                  : "any";
                const defaultValue = param.initializer
                  ? param.initializer.getText().trim().replace(/['"]+/g, "")
                  : null;

                return { [paramName]: { types: [paramType], defaultValue } };
              });

              if (constructor.body) {
                // Основная реализация конструктора
                classMembers["constructor"] = {
                  params: constructorParams,
                  body: constructor.body.getText(),
                };
              } else {
                // Сигнатура конструктора (перегрузка)
                classMembers[`constructorSignature${index}`] = {
                  params: constructorParams,
                };
              }
            });
          }

          // Обработка остальных членов класса
          node.members.forEach((member) => {
            if (!ts.isConstructorDeclaration(member)) {
              let accessModifier = "opened";

              if (member.name && ts.isPrivateIdentifier(member.name)) {
                accessModifier = "private";
              } else if (member.modifiers) {
                if (
                  member.modifiers.some(
                    (mod) => mod.kind === ts.SyntaxKind.PrivateKeyword
                  )
                ) {
                  accessModifier = "private";
                } else if (
                  member.modifiers.some(
                    (mod) => mod.kind === ts.SyntaxKind.ProtectedKeyword
                  )
                ) {
                  accessModifier = "protected";
                }
                if (
                  member.modifiers.some(
                    (mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword
                  )
                ) {
                  accessModifier = "readonly";
                }
              } else if (member.name && /^_/.test(member.name.getText())) {
                accessModifier = "protected";
              }

              const cleanName =
                member.name?.getText()?.replace(/^[_#]/, "") || "unknown";

              if (ts.isPropertyDeclaration(member)) {
                const propertyName = cleanName;
                const propertyType = member.type
                  ? member.type.getText().trim()
                  : "unknown";
                const initializer = member.initializer
                  ? member.initializer.getText().trim().replace(/['"]+/g, "")
                  : null;
                classMembers[propertyName] = {
                  types: [propertyType],
                  value: initializer,
                  modificator: accessModifier,
                };
              } else if (ts.isMethodDeclaration(member)) {
                const methodName = cleanName;
                const methodParams = member.parameters.map((param) => ({
                  name: param.name.getText(),
                  type: param.type ? param.type.getText().trim() : "any",
                }));
                const returnType = checker
                  .getTypeAtLocation(member)
                  .getCallSignatures()[0]
                  .getReturnType();
                const returnTypeString = checker.typeToString(returnType);
                const body = member.body?.getText(); // Добавляем тело метода
                classMembers[methodName] = {
                  types: ["function"],
                  params: methodParams,
                  returnResult: [returnTypeString],
                  modificator: accessModifier,
                  body, // Сохраняем тело метода
                };
              }
            }
          });

          context.classes[className] = {
            ...classMembers,
            extends: extendedClasses,
            isExported: isExported(node), // Добавляем флаг экспорта
          };
          break;
        case ts.SyntaxKind.ExpressionStatement:
          if (ts.isBinaryExpression(node.expression)) {
            const expr = node.expression;
            if (expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
              if (ts.isPropertyAccessExpression(expr.left)) {
                const objectName = expr.left.expression.getText();
                const propertyName = expr.left.name.getText();

                // Ищем существующую переменную/функцию
                const target =
                  allVariables.variables[objectName] ||
                  allVariables.functions[objectName];

                if (target) {
                  target[propertyName] = {
                    value: expr.right.getText().replace(/['"]+/g, ""),
                    types: [
                      checker.typeToString(
                        checker.getTypeAtLocation(expr.right)
                      ),
                    ],
                  };
                }
              }
            }
          }
          break;

          // Добавляем обработку namespaces
        case ts.SyntaxKind.ModuleDeclaration:
          if (ts.isModuleDeclaration(node) && node.body && ts.isModuleBlock(node.body)) {
            const namespaceName = node.name.getText();
            const namespaceContent = Object.keys(allVariables).reduce((acc, key) => ({
              ...acc,
              [key]: {},
            }), {});

            // Рекурсивно парсим содержимое namespace
            ts.forEachChild(node.body, (childNode) => {
              parseNode(childNode, checker, namespaceContent);
            });

            context.namespaces[namespaceName] = {
              ...namespaceContent,
              isExported: isExported(node),
            };
          }
          break;
        default:
          break;
      }
    }

    const program = ts.createProgram(filePaths, {});
    const checker = program.getTypeChecker();

    for (const filePath of filePaths) {
      const sourceFile = program.getSourceFile(filePath);
      if (sourceFile) {
        ts.forEachChild(sourceFile, (node) => parseNode(node, checker));
      }
    }

    console.log("Все найденные элементы:", allVariables);
    return allVariables;
  } catch (err) {
    console.error("Ошибка при чтении файлов:", err);
  }
}

module.exports = { createTempFileWithContent, readTsFiles };
