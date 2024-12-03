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

  const result = {
    variables: {},
    functions: {},
    classes: {},
    types: {},
    interfaces: {},
    enums: {},
  };

  try {
    const program = ts.createProgram([tempFilename], {});
    const sourceFile = program.getSourceFile(tempFilename);
    const typeChecker = program.getTypeChecker();
    function recursivelyGetVariableDeclarations(node, sourceFile) {
      if (node.kind === ts.SyntaxKind.VariableDeclaration) {
        const nodeText = node.getText(sourceFile);
        const type = typeChecker.getTypeAtLocation(node);
        const typeName = typeChecker.typeToString(type, node).split("|");
        const name = node.name.getText(sourceFile);
        result.variables[name] = { name: name, type: typeName };
      } else if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
        const name = node.name.getText(sourceFile);
        const parameters = {};
        node.parameters.forEach((param) => {
          const paramName = param.name.getText(sourceFile);
          const paramType = typeChecker.getTypeAtLocation(param);
          const paramTypeName = typeChecker
            .typeToString(paramType, param)
            .split("|");
          parameters[paramName] = {
            name: paramName,
            type: paramTypeName.join("|"),
          };
        });

        const returnType = typeChecker.getTypeAtLocation(node.type);
        const returnTypeName = typeChecker.typeToString(returnType, node.type);

        result.functions[name] = {
          name: name,
          parameters: parameters,
          type: returnTypeName,
        };
      }

      node.forEachChild((child) =>
        recursivelyGetVariableDeclarations(child, sourceFile)
      );
    }

    recursivelyGetVariableDeclarations(sourceFile, sourceFile);
  } finally {
    fs.unlinkSync(tempFilename);
  }

  return result;
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

    function parseObject(node, typeNode = null, checker = null) {
      const obj = {};
      const propertiesMap = {};

      if (typeNode && checker) {
        const type = checker.getTypeAtLocation(typeNode);
        type.getProperties().forEach((prop) => {
          const propType = checker.getTypeOfSymbolAtLocation(
            prop,
            prop.valueDeclaration
          );
          propertiesMap[prop.name] = checker.typeToString(propType);
        });
      }

      ts.forEachChild(node, (property) => {
        const name = property.name ? property.name.getText() : undefined;
        if (name) {
          let type = propertiesMap[name] || "object";
          if (ts.isObjectLiteralExpression(property.initializer)) {
            obj[name] = {
              types: ["object"],
              value: parseObject(
                property.initializer,
                property.initializer,
                checker
              ),
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

    function parseNode(node, checker) {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
          node.declarationList.declarations.forEach((declaration) => {
            const name = declaration.name.getText();
            let type = "any"; // Set default type to "any"
            if (declaration.type) {
              type = declaration.type.getText().trim();
            } else if (
              declaration.initializer &&
              ts.isAsExpression(declaration.initializer)
            ) {
              type = declaration.initializer.type.getText().trim();
            } else if (
              declaration.initializer &&
              ts.isLiteralExpression(declaration.initializer)
            ) {
              type = "any"; // Default type to "any"
            } else if (
              declaration.initializer &&
              ts.isArrayLiteralExpression(declaration.initializer)
            ) {
              type = "array";
            } else if (
              declaration.initializer &&
              ts.isObjectLiteralExpression(declaration.initializer)
            ) {
              type = "object";
            } else if (
              declaration.initializer &&
              declaration.initializer.kind ===
                ts.SyntaxKind.PrefixUnaryExpression &&
              (declaration.initializer.operator === ts.SyntaxKind.MinusToken ||
                declaration.initializer.operator === ts.SyntaxKind.PlusToken)
            ) {
              type = "any"; // Default type to "any"
            } else if (
              declaration.initializer &&
              declaration.initializer.kind === ts.SyntaxKind.Identifier &&
              ["NaN", "Infinity"].includes(declaration.initializer.getText())
            ) {
              type = "any"; // Default type to "any"
            } else if (
              declaration.initializer &&
              ts.isPropertyAccessExpression(declaration.initializer) &&
              declaration.initializer.expression.getText() === "Number"
            ) {
              type = "any"; // Default type to "any"
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
                value: parseObject(
                  declaration.initializer,
                  declaration.type,
                  checker
                ),
              };
            } else {
              allVariables.variables[name] = {
                types: [type],
                value: initializer,
              };
            }
          });
          break;
        case ts.SyntaxKind.InterfaceDeclaration:
          const interfaceName = node.name.getText();
          const properties = node.members.map((member) => ({
            name: member.name.getText(),
            type: member.type.getText().trim(),
          }));
          allVariables.interfaces[interfaceName] = { properties };
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          const functionName = node.name.getText();
          const params = node.parameters.map((param) => ({
            name: param.name.getText(),
            type: param.type ? param.type.getText().trim() : "any", // Set default type to "any"
          }));
          const type = checker.getTypeAtLocation(node);
          const signature = type.getCallSignatures()[0];
          const returnType = signature.getReturnType();
          const returnTypeString = checker.typeToString(returnType);
          allVariables.functions[functionName] = {
            types: ["function"],
            params,
            returnResult: [returnTypeString],
          };
          break;
        case ts.SyntaxKind.TypeAliasDeclaration:
          const typeName = node.name.getText();
          const aliasType = node.type.getText().trim();
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
              const type = checker.getTypeAtLocation(member);
              const signature = type.getCallSignatures()[0];
              const returnType = signature.getReturnType();
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

module.exports = { parseTypeScriptString, readTsFiles };
