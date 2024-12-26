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

  return tempFilename

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
    };

    function parseObject(node, checker) {
      const obj = {};
      ts.forEachChild(node, (property) => {
        const name = property.name ? property.name.getText() : undefined;
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
        type.type = "object";
        type.properties = {};
        node.members.forEach((member) => {
          const name = member.name ? member.name.getText() : undefined;
          const memberType = member.type ? member.type.getText().trim() : undefined;
          if (name && memberType) {
            type.properties[name] = memberType;
          }
        });
      } else if (ts.isUnionTypeNode(node)) {
        type.type = "combined";
        type.possibleTypes = node.types.map((t) => parseType(t));
      } else {
        type.value = node.getText().trim();
      }
      return type;
    }

    function getReturnTypeOfExpression(expression, checker) {
      const type = checker.getTypeAtLocation(expression);
      return checker.typeToString(type);
    }

    function parseNode(node, checker) {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
          node.declarationList.declarations.forEach((declaration) => {
            if (ts.isArrayBindingPattern(declaration.name)) {
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
                  allVariables.variables[elementName] = {
                    types: [elementType],
                    from: declaration.initializer.getText().trim(), // Set the source of the value
                  };
                });
              }
            } else if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
              const name = declaration.name.getText();
              const funcType = checker.getTypeAtLocation(declaration);
              const returnType = checker.getReturnTypeOfSignature(
                checker.getSignaturesOfType(funcType, ts.SignatureKind.Call)[0]
              );
              const returnTypeString = checker.typeToString(returnType);
              const params = declaration.initializer.parameters.map(param => ({
                name: param.name.getText(),
                type: param.type ? param.type.getText() : 'any'
              }));
              allVariables.functions[name] = {
                types: ["function"],
                params,
                returnResult: [returnTypeString],
              };
            } else {
              const name = declaration.name.getText();
              let type = "any"; // Set default type to "any"
              if (declaration.type) {
                type = declaration.type.getText().trim();
              }
              const initializer = declaration.initializer
                ? declaration.initializer.getText().trim().replace(/['"]+/g, "")
                : null;

              if (
                initializer &&
                ts.isObjectLiteralExpression(declaration.initializer)
              ) {
                allVariables.variables[name] = {
                  types: [type],
                  value: parseObject(declaration.initializer, checker),
                };
              } else if (initializer && ts.isCallExpression(declaration.initializer)) {
                const returnTypeString = getReturnTypeOfExpression(declaration.initializer, checker);
                allVariables.variables[name] = {
                  types: [returnTypeString],
                  value: initializer,
                };
              } else {
                allVariables.variables[name] = {
                  types: [type],
                  value: initializer,
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
          allVariables.interfaces[interfaceName] = { properties };
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          const functionName = node.name.getText();
          const params = node.parameters.map((param) => ({
            name: param.name.getText(),
            type: param.type ? param.type.getText().trim() : "any",
          }));
          const returnType = checker
            .getTypeAtLocation(node)
            .getCallSignatures()[0]
            .getReturnType();
          const returnTypeString = checker.typeToString(returnType);
          allVariables.functions[functionName] = {
            types: ["function"],
            params,
            returnResult: [returnTypeString],
          };
          break;
        case ts.SyntaxKind.TypeAliasDeclaration:
          const typeName = node.name.getText();
          const aliasType = parseType(node.type);
          allVariables.types[typeName] = aliasType;
          break;
        case ts.SyntaxKind.EnumDeclaration:
          const enumName = node.name.getText();
          const members = node.members.map((member) => member.name.getText());
          allVariables.enums[enumName] = members;
          break;
        case ts.SyntaxKind.ClassDeclaration:
          const className = node.name.getText();
          const classMembers = {};
          node.members.forEach((member) => {
            if (ts.isMethodDeclaration(member)) {
              const methodName = member.name.getText();
              const methodParams = member.parameters.map((param) => ({
                name: param.name.getText(),
                type: param.type ? param.type.getText().trim() : "any", // Set default type to "any"
              }));
              const returnType = checker
                .getTypeAtLocation(member)
                .getCallSignatures()[0]
                .getReturnType();
              const returnTypeString = checker.typeToString(returnType);
              classMembers[methodName] = {
                types: ["function"],
                params: methodParams,
                returnResult: [returnTypeString],
              };
            } else if (ts.isConstructorDeclaration(member)) {
              member.parameters.forEach((param) => {
                const paramName = param.name.getText();
                const paramType = param.type
                  ? param.type.getText().trim()
                  : "any"; // Set default type to "any"
                classMembers[paramName] = { types: [paramType], value: null };
              });
            } else if (ts.isPropertyDeclaration(member)) {
              const propertyName = member.name.getText();
              const propertyType = member.type
                ? member.type.getText().trim()
                : "unknown";
              const initializer = member.initializer
                ? member.initializer.getText().trim().replace(/['"]+/g, "")
                : null;
              classMembers[propertyName] = {
                types: [propertyType],
                value: initializer,
              };
            }
          });
          allVariables.classes[className] = classMembers;
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
