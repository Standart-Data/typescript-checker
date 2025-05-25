const ts = require("typescript");
const fs = require("fs");
const path = require("path");

/**
 * Обрабатывает декораторы для класса, методов, свойств и параметров
 * @param {ts.Node} node - нода с возможными декораторами
 * @returns {Array} массив информации о декораторах
 */
function parseDecorators(node) {
  if (!node.decorators || node.decorators.length === 0) {
    return [];
  }

  return node.decorators.map((decorator) => {
    const expression = decorator.expression;
    let name = "";
    let args = [];

    if (expression.kind === ts.SyntaxKind.CallExpression) {
      name = expression.expression.getText();
      args = expression.arguments.map((arg) => arg.getText());
    } else {
      name = expression.getText();
    }
    return { name, args };
  });
}

/**
 * Функция для более детального разбора содержимого модулей и неймспейсов
 * @param {ts.Node} node - нода модуля или неймспейса
 * @param {ts.TypeChecker} checker - средство проверки типов TypeScript
 * @param {Object} allVariables - объект для хранения найденных переменных и типов
 * @param {boolean} isDeclared - флаг, указывающий, имеет ли элемент модификатор declare
 */
function parseModuleContents(node, checker, allVariables, isDeclared) {
  const moduleName = node.name.getText().replace(/['"]+/g, "");
  const isGlobal = moduleName === "global";
  const moduleData = {
    exports: {},
    interfaces: {},
    functions: {},
    classes: {},
    variables: {},
    types: {},
    enums: {},
  };

  if (node.body && ts.isModuleBlock(node.body)) {
    node.body.statements.forEach((statement) => {
      // Используем обновленные parseSimple... функции, передавая им moduleData и checker
      if (ts.isFunctionDeclaration(statement)) {
        parseSimpleFunctionDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true /*isModuleMember*/
        );
      } else if (ts.isInterfaceDeclaration(statement)) {
        parseSimpleInterfaceDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isClassDeclaration(statement)) {
        parseSimpleClassDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isVariableStatement(statement)) {
        parseSimpleVariableStatement(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isTypeAliasDeclaration(statement)) {
        parseSimpleTypeAliasDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      } else if (ts.isEnumDeclaration(statement)) {
        parseSimpleEnumDeclaration(
          statement,
          moduleData,
          checker,
          isDeclared,
          true
        );
      }
      // Добавить обработку других типов экспортируемых/объявленных сущностей, если нужно
    });
  }

  if (isGlobal) {
    // Для declare global объединяем с корневым allVariables
    Object.assign(
      allVariables.declarations,
      moduleData.functions,
      moduleData.interfaces,
      moduleData.classes,
      moduleData.variables,
      moduleData.types,
      moduleData.enums
    );
  } else {
    const target =
      node.flags & ts.NodeFlags.Namespace
        ? allVariables.namespaces
        : allVariables.modules;
    target[moduleName] = {
      ...moduleData,
      isDeclared,
    };
  }
}

// Вспомогательные функции для парсинга различных конструкций (обновленные)
function parseSimpleFunctionDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const functionName = node.name.text;
    const decorators = parseDecorators(node);
    const signature = checker.getSignatureFromDeclaration(node);
    let returnType = "void";
    if (signature) {
      returnType = checker.typeToString(signature.getReturnType());
    }

    // Анализируем дополнительные модификаторы функции
    const isGenerator = node.asteriskToken !== undefined || false;

    const isDefault =
      node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.DefaultKeyword
      ) || false;

    context.functions[functionName] = {
      name: functionName,
      parameters:
        node.parameters?.map((param) => ({
          name: param.name?.getText() || "",
          type: param.type
            ? checker.typeToString(checker.getTypeAtLocation(param.type))
            : "any",
          optional: !!param.questionToken,
          initializer: param.initializer?.getText(),
        })) || [],
      returnType: node.type
        ? checker.typeToString(checker.getTypeAtLocation(node.type))
        : returnType,
      isAsync:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.AsyncKeyword
        ) || false,
      isGenerator: isGenerator, // Добавляем флаг генератора
      isDefault: isDefault, // Добавляем флаг экспорта по умолчанию
      isExported:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
        ) ||
        false ||
        isModuleMember,
      isDeclared:
        isParentDeclared ||
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
        ) ||
        false,
      decorators: decorators.length > 0 ? decorators : undefined,
      // TODO: generics, overloads, body
    };
  }
}

function parseSimpleVariableStatement(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  const isExported =
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) ||
    false ||
    isModuleMember;
  const isDeclared =
    isParentDeclared ||
    node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DeclareKeyword) ||
    false;

  node.declarationList.declarations.forEach((declaration) => {
    if (declaration.name?.kind === ts.SyntaxKind.Identifier) {
      const varName = declaration.name.text;
      let varType = "any";
      if (declaration.type) {
        varType = checker.typeToString(
          checker.getTypeAtLocation(declaration.type)
        );
      } else if (declaration.initializer) {
        varType = checker.typeToString(
          checker.getTypeAtLocation(declaration.initializer)
        );
      }

      // Определяем тип объявления переменной
      let declarationType = "var"; // по умолчанию
      if ((node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
        declarationType = "const";
      } else if ((node.declarationList.flags & ts.NodeFlags.Let) !== 0) {
        declarationType = "let";
      }

      context.variables[varName] = {
        name: varName,
        type: varType,
        isConst: (node.declarationList.flags & ts.NodeFlags.Const) !== 0,
        declarationType: declarationType, // Добавляем тип объявления (var/let/const)
        hasInitializer: !!declaration.initializer,
        initializerValue: declaration.initializer?.getText(),
        isExported: isExported,
        isDeclared: isDeclared,
        // Поля для обратной совместимости со старыми тестами
        types: [varType], // старые тесты ожидают массив типов
        value: declaration.initializer?.getText()?.replace(/['"]/g, "") || "", // старые тесты ожидают значение без кавычек
        // TODO: decorators on variable/property might need special handling if they exist
      };
    }
  });
}

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

    // Анализируем модификаторы класса
    const isAbstract =
      node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.AbstractKeyword
      ) || false;

    context.classes[className] = {
      name: className,
      properties: {},
      methods: {},
      constructorDef: null,
      isExported:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
        ) ||
        false ||
        isModuleMember,
      isDeclared:
        isParentDeclared ||
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
        ) ||
        false,
      isAbstract: isAbstract, // Добавляем флаг абстрактного класса
      decorators: decorators.length > 0 ? decorators : undefined,
      extends: extendedTypes.length > 0 ? extendedTypes : undefined,
      implements: implementedTypes.length > 0 ? implementedTypes : undefined,
    };

    node.members?.forEach((member) => {
      const memberName = member.name?.getText();
      if (!memberName) return;
      const memberDecorators = parseDecorators(member);

      if (ts.isPropertyDeclaration(member)) {
        // Определяем модификаторы доступа
        let accessModifier = "public"; // по умолчанию public
        if (
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.PrivateKeyword
          )
        ) {
          accessModifier = "private";
        } else if (
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.ProtectedKeyword
          )
        ) {
          accessModifier = "protected";
        }

        const isAbstract =
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.AbstractKeyword
          ) || false;

        const isOverride =
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.OverrideKeyword
          ) || false;

        context.classes[className].properties[memberName] = {
          name: memberName,
          type: member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : member.initializer
            ? checker.typeToString(
                checker.getTypeAtLocation(member.initializer)
              )
            : "any",
          isStatic:
            member.modifiers?.some(
              (mod) => mod.kind === ts.SyntaxKind.StaticKeyword
            ) || false,
          isReadonly:
            member.modifiers?.some(
              (mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword
            ) || false,
          accessModifier: accessModifier, // Добавляем модификатор доступа
          isAbstract: isAbstract, // Добавляем флаг абстрактного свойства
          isOverride: isOverride, // Добавляем флаг переопределения
          decorators:
            memberDecorators.length > 0 ? memberDecorators : undefined,
          initializer: member.initializer?.getText(),
        };
      } else if (ts.isMethodDeclaration(member)) {
        // Определяем модификаторы доступа для методов
        let accessModifier = "public"; // по умолчанию public
        if (
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.PrivateKeyword
          )
        ) {
          accessModifier = "private";
        } else if (
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.ProtectedKeyword
          )
        ) {
          accessModifier = "protected";
        }

        const isAbstract =
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.AbstractKeyword
          ) || false;

        const isOverride =
          member.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.OverrideKeyword
          ) || false;

        const methodSignature = checker.getSignatureFromDeclaration(member);
        context.classes[className].methods[memberName] = {
          name: memberName,
          parameters:
            member.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
              optional: !!param.questionToken,
              initializer: param.initializer?.getText(),
            })) || [],
          returnType: methodSignature
            ? checker.typeToString(methodSignature.getReturnType())
            : "any",
          isStatic:
            member.modifiers?.some(
              (mod) => mod.kind === ts.SyntaxKind.StaticKeyword
            ) || false,
          isAsync:
            member.modifiers?.some(
              (mod) => mod.kind === ts.SyntaxKind.AsyncKeyword
            ) || false,
          accessModifier: accessModifier, // Добавляем модификатор доступа
          isAbstract: isAbstract, // Добавляем флаг абстрактного метода
          isOverride: isOverride, // Добавляем флаг переопределения
          decorators:
            memberDecorators.length > 0 ? memberDecorators : undefined,
        };
      } else if (ts.isConstructorDeclaration(member)) {
        context.classes[className].constructorDef = {
          parameters:
            member.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
              optional: !!param.questionToken,
              initializer: param.initializer?.getText(),
              decorators:
                parseDecorators(param).length > 0
                  ? parseDecorators(param)
                  : undefined,
            })) || [],
          decorators:
            memberDecorators.length > 0 ? memberDecorators : undefined, // Decorators on constructor itself
        };
      }
    });
  }
}

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

    context.interfaces[interfaceName] = {
      name: interfaceName,
      properties: {},
      methods: {},
      isExported:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
        ) ||
        false ||
        isModuleMember,
      isDeclared:
        isParentDeclared ||
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
        ) ||
        false,
      extends: extendedTypes.length > 0 ? extendedTypes : undefined,
    };

    node.members?.forEach((member) => {
      const memberName = member.name?.getText();
      if (!memberName) return;

      if (ts.isPropertySignature(member)) {
        context.interfaces[interfaceName].properties[memberName] = {
          name: memberName,
          type: member.type
            ? checker.typeToString(checker.getTypeAtLocation(member.type))
            : "any",
          optional: !!member.questionToken,
        };
      } else if (ts.isMethodSignature(member)) {
        const methodSignature = checker.getSignatureFromDeclaration(member);
        context.interfaces[interfaceName].methods[memberName] = {
          name: memberName,
          parameters:
            member.parameters?.map((param) => ({
              name: param.name?.getText() || "",
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
              optional: !!param.questionToken,
            })) || [],
          returnType: methodSignature
            ? checker.typeToString(methodSignature.getReturnType())
            : "any",
        };
      }
    });
  }
}

function parseSimpleTypeAliasDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const typeName = node.name.text;
    const typeDefinition = checker.typeToString(
      checker.getTypeAtLocation(node.type)
    );

    // Базовая информация о типе
    const typeInfo = {
      name: typeName,
      definition: typeDefinition,
      isExported:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
        ) ||
        false ||
        isModuleMember,
      isDeclared:
        isParentDeclared ||
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
        ) ||
        false,
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
              type: param.type
                ? checker.typeToString(checker.getTypeAtLocation(param.type))
                : "any",
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
                  type: param.type
                    ? checker.typeToString(
                        checker.getTypeAtLocation(param.type)
                      )
                    : "any",
                })) || [];

              const methodReturnType = member.type
                ? checker.typeToString(checker.getTypeAtLocation(member.type))
                : "void";

              const paramString = methodParams
                .map((p) => `${p.name}: ${p.type}`)
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

function parseSimpleEnumDeclaration(
  node,
  context,
  checker,
  isParentDeclared,
  isModuleMember = false
) {
  if (node.name) {
    const enumName = node.name.text;

    // Проверяем, является ли enum константным (const enum)
    const isConst =
      node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ConstKeyword) ||
      false;

    context.enums[enumName] = {
      name: enumName,
      isConst: isConst, // Добавляем флаг для различения const enum от обычного enum
      members:
        node.members?.map((member) => {
          const memberName = member.name.getText();
          let memberValue = checker.getConstantValue(member);
          if (typeof memberValue === "string") {
            memberValue = `"${memberValue}"`; // Keep quotes for string enum values
          }
          return { name: memberName, value: memberValue };
        }) || [],
      isExported:
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
        ) ||
        false ||
        isModuleMember,
      isDeclared:
        isParentDeclared ||
        node.modifiers?.some(
          (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
        ) ||
        false,
    };
  }
}

function parseSimpleImportDeclaration(node, context, checker) {
  if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    const moduleName = node.moduleSpecifier.text;
    if (!context.imports[moduleName]) {
      context.imports[moduleName] = {
        module: moduleName,
        defaultImport: null,
        namedImports: [],
      };
    }

    if (node.importClause) {
      if (node.importClause.name) {
        // Default import: import D from 'module'
        context.imports[moduleName].defaultImport = node.importClause.name.text;
      }
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // Namespace import: import * as N from 'module'
          // Можно добавить специальную обработку для NamespaceImport, если нужно
          // context.imports[moduleName].namespaceImport = node.importClause.namedBindings.name.text;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          // Named imports: import { A, B as C } from 'module'
          node.importClause.namedBindings.elements.forEach((element) => {
            context.imports[moduleName].namedImports.push({
              name: element.name.text,
              alias: element.propertyName?.text,
            });
          });
        }
      }
    }
  }
}

function parseSimpleExportDeclaration(node, context, checker) {
  if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    node.exportClause.elements.forEach((specifier) => {
      const name = specifier.name.text;
      const alias = specifier.propertyName?.text;
      if (!context.exports.namedExports) context.exports.namedExports = [];
      context.exports.namedExports.push({
        name,
        alias,
        from: node.moduleSpecifier?.text,
      });
    });
  } else if (node.moduleSpecifier) {
    // export * from 'module'
    if (!context.exports.reExports) context.exports.reExports = [];
    context.exports.reExports.push({ module: node.moduleSpecifier.text });
  }
  // export default ... handled by specific declaration nodes (FunctionDeclaration, ClassDeclaration, etc.) with ExportKeyword and DefaultKeyword
}

/**
 * Парсит TypeScript/JavaScript файлы и извлекает метаданные.
 * Использует TypeChecker для более точного анализа типов.
 * @param {string[]} filePaths - Массив путей к файлам для парсинга.
 * @returns {Object} - Объект с метаданными.
 */
function parseTypeScript(filePaths) {
  const result = {
    functions: {},
    variables: {},
    classes: {},
    interfaces: {},
    types: {},
    enums: {},
    imports: {},
    exports: {},
    declarations: {}, // Для declare global и других глобальных объявлений
    modules: {}, // Для declare module "..."
    namespaces: {}, // Для declare namespace X {}
  };

  // Пытаемся найти и загрузить tsconfig.json, если он есть
  let compilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext, // или CommonJS, в зависимости от проекта
    jsx: ts.JsxEmit.React, // или Preserve, если JSX обрабатывается Babel
    allowJs: true,
    esModuleInterop: true,
    skipLibCheck: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  };
  if (filePaths.length > 0) {
    // Попытка найти tsconfig.json относительно первого файла или в корне проекта (если возможно)
    // Это упрощенная логика, в реальном проекте может потребоваться более сложный поиск tsconfig
    const probableTsConfigPath = ts.findConfigFile(
      path.dirname(filePaths[0]),
      ts.sys.fileExists
    );
    if (probableTsConfigPath) {
      const configFile = ts.readConfigFile(
        probableTsConfigPath,
        ts.sys.readFile
      );
      const parsedCmd = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(probableTsConfigPath)
      );
      if (parsedCmd.options) {
        compilerOptions = { ...compilerOptions, ...parsedCmd.options };
      }
    }
  }

  const program = ts.createProgram(filePaths, compilerOptions);
  const checker = program.getTypeChecker();

  filePaths.forEach((filePath) => {
    const sourceFile = program.getSourceFile(filePath);
    if (sourceFile) {
      function visit(node) {
        const isDeclared =
          node.modifiers?.some(
            (mod) => mod.kind === ts.SyntaxKind.DeclareKeyword
          ) || false;

        switch (node.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            parseSimpleFunctionDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.VariableStatement:
            parseSimpleVariableStatement(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.ClassDeclaration:
            parseSimpleClassDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.InterfaceDeclaration:
            parseSimpleInterfaceDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.TypeAliasDeclaration:
            parseSimpleTypeAliasDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.EnumDeclaration:
            parseSimpleEnumDeclaration(node, result, checker, isDeclared);
            break;
          case ts.SyntaxKind.ImportDeclaration:
            parseSimpleImportDeclaration(node, result, checker);
            break;
          case ts.SyntaxKind.ExportDeclaration:
          case ts.SyntaxKind.ExportAssignment: // export default ...
            // ExportAssignment (export default x;) будет обработан через Variable, Function, Class с ExportDefault флагом.
            // ExportDeclaration (export {x} or export * from '...'),
            parseSimpleExportDeclaration(node, result, checker);
            break;
          case ts.SyntaxKind.ModuleDeclaration: // declare module "..." or namespace X {}
            parseModuleContents(node, checker, result, isDeclared);
            break;
          // Другие типы узлов AST, если необходимо
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);
    }
  });

  return result;
}

module.exports = {
  parseTypeScript,
  // createTempFileWithContent - удалена, т.к. перенесена в utils
};
