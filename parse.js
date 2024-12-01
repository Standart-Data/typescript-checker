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

    function parseObject(node) {
      const obj = {};
      ts.forEachChild(node, (property) => {
        if (
          ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property)
        ) {
          const name = property.name.getText();
          if (ts.isObjectLiteralExpression(property.initializer)) {
            obj[name] = {
              types: ["object"],
              value: parseObject(property.initializer),
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
              types: ["unknown"],
              value: property.initializer
                ? property.initializer.getText().replace(/['"]+/g, "")
                : null,
            };
          }
        }
      });
      return obj;
    }

    function parseNode(node) {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
          node.declarationList.declarations.forEach((declaration) => {
            const name = declaration.name.getText();
            const type = declaration.type
              ? declaration.type.getText().trim()
              : "unknown";
            const initializer = declaration.initializer
              ? declaration.initializer
              : null;

            if (initializer && ts.isObjectLiteralExpression(initializer)) {
              allVariables.variables[name] = {
                types: [type],
                value: parseObject(initializer),
              };
            } else {
              allVariables.variables[name] = {
                types: [type],
                value: initializer
                  ? initializer.getText().trim().replace(/['"]+/g, "")
                  : null,
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
          const params = node.parameters.map((param) => param.getText().trim());
          const returnType = node.type ? node.type.getText().trim() : "void";
          allVariables.functions[functionName] = {
            types: ["function"],
            params,
            returnResult: [returnType],
          };
          break;
        case ts.SyntaxKind.TypeAliasDeclaration:
          const typeName = node.name.getText();
          const type = node.type.getText().trim();
          allVariables.types[typeName] = type;
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
              const methodParams = member.parameters.map((param) =>
                param.getText().trim()
              );
              const methodReturnType = member.type
                ? member.type.getText().trim()
                : "void";
              classMembers[methodName] = {
                types: ["function"],
                params: methodParams,
                returnResult: [methodReturnType],
              };
            } else if (ts.isConstructorDeclaration(member)) {
              member.parameters.forEach((param) => {
                const paramName = param.name.getText();
                const paramType = param.type
                  ? param.type.getText().trim()
                  : "unknown";
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

    for (const filePath of filePaths) {
      const data = fs.readFileSync(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(
        filePath,
        data,
        ts.ScriptTarget.Latest,
        true
      );

      ts.forEachChild(sourceFile, parseNode);
    }

    console.log("Все найденные элементы:", allVariables);
    return allVariables;
  } catch (err) {
    console.error("Ошибка при чтении файлов:", err);
  }
}

// Использование: передайте массив путей к файлам .ts для обработки

readTsFiles(["main.ts", "unique_typescript.ts"]);

describe("First test", function () {
  it("В коде объявлена переменная a c типом number", function () {
    assert.ok(allVariables["a"]["type"].includes("number"));
  });
});
//   it("В коде объявлена переменная b c типом string", function () {
//     assert.ok(allVariables["b"]["type"].includes("string"));
//   });
// });

module.exports = { parseTypeScriptString, readTsFiles };
