const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

const {
  isArrowFunctionComponent,
  isFunctionComponent,
  isFunctionDeclarationComponent,
  isReactClassComponent,
} = require("./detectors");

const {
  processFunctionalComponent,
  processClassComponent,
  processFunctionDeclarationComponent,
} = require("./processors");

const { isHookCall, processHook } = require("./hooks");

const { getTSType, getType } = require("./types");
const {
  getCommonModifiers,
  getAccessModifier,
  createOldFormatProperty,
} = require("./common-utils");

/**
 * Обрабатывает декораторы в React компонентах
 * @param {Object} path - путь к узлу AST
 * @returns {Array} массив с информацией о декораторах
 */
function parseDecorators(path) {
  const decorators = [];

  if (path.node.decorators && path.node.decorators.length > 0) {
    for (const decorator of path.node.decorators) {
      const decoratorInfo = {
        name: "",
        args: [],
      };

      if (t.isCallExpression(decorator.expression)) {
        // Для декораторов с аргументами - @Component({...})
        decoratorInfo.name =
          decorator.expression.callee.name ||
          decorator.expression.callee.getText();
        decorator.expression.arguments.forEach((arg) => {
          if (t.isObjectExpression(arg)) {
            const argObj = {};
            arg.properties.forEach((prop) => {
              if (t.isObjectProperty(prop)) {
                const key = prop.key.name;
                let value;

                if (t.isStringLiteral(prop.value)) {
                  value = prop.value.value;
                } else if (t.isNumericLiteral(prop.value)) {
                  value = prop.value.value;
                } else {
                  value = prop.value.getText
                    ? prop.value.getText()
                    : prop.value.toString();
                }

                argObj[key] = value;
              }
            });
            decoratorInfo.args.push(argObj);
          } else if (t.isStringLiteral(arg)) {
            decoratorInfo.args.push(arg.value);
          } else if (t.isNumericLiteral(arg)) {
            decoratorInfo.args.push(arg.value);
          } else {
            decoratorInfo.args.push(
              arg.getText ? arg.getText() : arg.toString()
            );
          }
        });
      } else {
        // Для простых декораторов без аргументов - @Input
        decoratorInfo.name =
          decorator.expression.name || decorator.expression.getText();
      }

      decorators.push(decoratorInfo);
    }
  }

  return decorators;
}

/**
 * Обрабатывает декораторы параметров для методов и функций
 * @param {Object} path - путь к узлу AST с параметрами
 * @returns {Array} массив с информацией о декораторах параметров
 */
function parseParamDecorators(path) {
  const paramDecorators = [];

  if (path.node.params && path.node.params.length > 0) {
    path.node.params.forEach((param, index) => {
      if (param.decorators && param.decorators.length > 0) {
        const decorators = [];

        param.decorators.forEach((decorator) => {
          const decoratorInfo = {
            name: "",
            args: [],
          };

          if (t.isCallExpression(decorator.expression)) {
            decoratorInfo.name =
              decorator.expression.callee.name ||
              decorator.expression.callee.getText();
            decorator.expression.arguments.forEach((arg) => {
              if (t.isStringLiteral(arg)) {
                decoratorInfo.args.push(arg.value);
              } else if (t.isNumericLiteral(arg)) {
                decoratorInfo.args.push(arg.value);
              } else {
                decoratorInfo.args.push(
                  arg.getText ? arg.getText() : arg.toString()
                );
              }
            });
          } else {
            decoratorInfo.name =
              decorator.expression.name || decorator.expression.getText();
          }

          decorators.push(decoratorInfo);
        });

        paramDecorators.push({
          index,
          name: param.name ? param.name.name : "param",
          decorators,
        });
      }
    });
  }

  return paramDecorators;
}

/**
 * Парсит файлы React и возвращает информацию о компонентах, типах и переменных
 * @param {string[]} filePaths Пути к файлам для парсинга
 * @returns {Object} Объект с информацией о компонентах, типах и переменных
 */
function parseReact(filePaths) {
  // Инициализируем результат в формате, совместимом с readTsFiles
  const result = {
    variables: {},
    interfaces: {},
    functions: {},
    types: {},
    enums: {},
    classes: {},
    declarations: {},
    modules: {},
    namespaces: {},
    exports: {},
    imports: [],
  };

  filePaths.forEach((filePath) => {
    try {
      const code = fs.readFileSync(filePath, "utf-8");

      // Определяем тип файла
      const isDeclarationFile = filePath.endsWith(".d.ts");
      const isTypeScriptFile =
        filePath.endsWith(".ts") || filePath.endsWith(".tsx");
      const isJSXFile = filePath.endsWith(".jsx");

      // Настраиваем плагины для парсера в зависимости от типа файла
      const parserPlugins = ["jsx"];

      // Добавляем плагин TypeScript только для TS файлов
      if (isTypeScriptFile || isDeclarationFile) {
        parserPlugins.push("typescript");
      }

      // Общие плагины для всех типов файлов
      parserPlugins.push("classProperties", "decorators-legacy");

      // Для JSX файлов могут потребоваться дополнительные плагины
      if (isJSXFile) {
        parserPlugins.push("objectRestSpread");
      }

      // Для .d.ts файлов добавляем специальные опции
      const parserOptions = {
        sourceType: "module",
        plugins: parserPlugins,
        // Указываем, что это файл объявлений типов
        allowImportExportEverywhere: isDeclarationFile,
      };

      const ast = parser.parse(code, parserOptions);

      // Сначала собираем все типы и интерфейсы (особенно важно для .d.ts файлов)
      traverse(ast, {
        TSInterfaceDeclaration(path) {
          // Обрабатываем только в TS файлах
          if (!isTypeScriptFile && !isDeclarationFile) return;

          const interfaceName = path.node.id.name;
          const properties = {};

          path.node.body.body.forEach((prop) => {
            let optional = false;
            if (prop.optional) {
              optional = true;
            }

            let propType = "any";
            if (prop.typeAnnotation) {
              propType = safeGetTSType(prop.typeAnnotation.typeAnnotation);
            }

            // Добавляем свойство в формате, совместимом с readTsFiles
            properties[prop.key.name] = propType;
          });

          // Добавляем интерфейс в формате, совместимом с readTsFiles
          result.interfaces[interfaceName] = {
            properties: properties,
            extendedBy: [],
            isDeclared: isDeclarationFile,
            isExported: getCommonModifiers(path.node, path).isExported,
          };
        },
        TSTypeAliasDeclaration(path) {
          // Обрабатываем только в TS файлах
          if (!isTypeScriptFile && !isDeclarationFile) return;

          const typeName = path.node.id.name;
          const typeValue = safeGetTSType(path.node.typeAnnotation);

          // Добавляем тип в формате, совместимом с readTsFiles
          result.types[typeName] = {
            type: typeof typeValue === "object" ? "object" : "primitive",
            properties: typeof typeValue === "object" ? typeValue : {},
            isDeclared: isDeclarationFile,
          };
        },
        TSEnumDeclaration(path) {
          // Обрабатываем только в TS файлах
          if (!isTypeScriptFile && !isDeclarationFile) return;

          const enumName = path.node.id.name;

          // Проверяем, является ли enum константным (const enum)
          const isConst = path.node.const || false;

          const members = path.node.members.map((member, index) => {
            const memberName = member.id.name;
            let memberValue = undefined;

            if (member.initializer) {
              if (t.isStringLiteral(member.initializer)) {
                memberValue = `"${member.initializer.value}"`;
              } else if (t.isNumericLiteral(member.initializer)) {
                memberValue = member.initializer.value;
              } else {
                // Для сложных выражений берем исходный код
                memberValue = code.slice(
                  member.initializer.start,
                  member.initializer.end
                );
              }
            } else {
              // Для числовых enum без инициализатора присваиваем индекс
              memberValue = index;
            }

            return { name: memberName, value: memberValue };
          });

          // Добавляем enum в формате, совместимом с readTsFiles
          result.enums[enumName] = {
            name: enumName,
            isConst: isConst, // Добавляем флаг для различения const enum от обычного enum
            members: members,
            isExported: getCommonModifiers(path.node, path).isExported,
            isDeclared: isDeclarationFile,
          };
        },
        // Обработка экспортов
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            // Экспорт объявления (function, class, interface, etc)
            if (path.node.declaration.id) {
              const name = path.node.declaration.id.name;
              result.exports[name] = true;
            } else if (path.node.declaration.declarations) {
              // Для случаев export const Component = ...
              path.node.declaration.declarations.forEach((declaration) => {
                if (declaration.id && declaration.id.name) {
                  const name = declaration.id.name;
                  result.exports[name] = true;

                  // Проверяем, является ли это React компонентом
                  if (
                    declaration.init &&
                    (t.isArrowFunctionExpression(declaration.init) ||
                      t.isFunctionExpression(declaration.init))
                  ) {
                    // Проверяем типизацию компонента (React.FC)
                    let isReactComponent = false;
                    if (declaration.id.typeAnnotation) {
                      const typeAnnotation =
                        declaration.id.typeAnnotation.typeAnnotation;
                      if (
                        typeAnnotation &&
                        t.isTSTypeReference(typeAnnotation)
                      ) {
                        if (
                          typeAnnotation.typeName &&
                          t.isIdentifier(typeAnnotation.typeName)
                        ) {
                          const typeName = typeAnnotation.typeName.name;
                          isReactComponent =
                            typeName === "FC" ||
                            typeName === "FunctionComponent";
                        } else if (
                          typeAnnotation.typeName &&
                          t.isTSQualifiedName(typeAnnotation.typeName)
                        ) {
                          const object = typeAnnotation.typeName.left?.name;
                          const property = typeAnnotation.typeName.right?.name;
                          isReactComponent =
                            object === "React" &&
                            (property === "FC" ||
                              property === "FunctionComponent");
                        }
                      }
                    }

                    // Если это React компонент, добавляем его в functions
                    if (isReactComponent || name[0] === name[0].toUpperCase()) {
                      // Получаем параметры функции
                      const params = declaration.init.params
                        ? declaration.init.params.map((param) => {
                            let paramName;
                            let paramType = "any";

                            // Обработка деструктурированных параметров ({prop1, prop2})
                            if (t.isObjectPattern(param)) {
                              paramName = "props";
                              paramType = declaration.id.typeAnnotation
                                ? safeGetTSType(
                                    declaration.id.typeAnnotation.typeAnnotation
                                      ?.typeParameters?.params?.[0]
                                  )
                                : "object";
                            } else {
                              paramName =
                                param.name || (param.left && param.left.name);
                              paramType = param.typeAnnotation
                                ? safeGetTSType(
                                    param.typeAnnotation.typeAnnotation
                                  )
                                : "any";
                            }

                            return { name: paramName, type: paramType };
                          })
                        : [];

                      // Добавляем компонент в секцию functions
                      result.functions[name] = {
                        params,
                        returnResult: ["JSX.Element"],
                        genericsTypes: [],
                        jsx: true,
                        body: declaration.init.body
                          ? code.slice(
                              declaration.init.body.start,
                              declaration.init.body.end
                            )
                          : undefined,
                      };
                    }
                  }
                }
              });
            }
          } else if (path.node.specifiers) {
            // Экспорт из другого модуля или re-export
            path.node.specifiers.forEach((specifier) => {
              if (specifier.exported) {
                const exportedName = specifier.exported.name;
                result.exports[exportedName] = true;
              }
            });
          }
        },
        ExportDefaultDeclaration(path) {
          // Экспорт по умолчанию
          if (path.node.declaration && path.node.declaration.id) {
            const name = path.node.declaration.id.name;
            result.exports[name] = true;
            result.exports.default = name;
          } else {
            // Анонимный экспорт по умолчанию
            result.exports.default = true;
          }
        },
        // Парсинг импортов
        ImportDeclaration(path) {
          const importSource = path.node.source.value;
          const importSpecifiers = path.node.specifiers.map((specifier) => {
            if (specifier.type === "ImportDefaultSpecifier") {
              return {
                local: specifier.local.name,
                imported: "default",
              };
            } else if (specifier.type === "ImportSpecifier") {
              return {
                local: specifier.local.name,
                imported: specifier.imported?.name || specifier.local.name,
              };
            } else if (specifier.type === "ImportNamespaceSpecifier") {
              return {
                local: specifier.local.name,
                imported: "*",
              };
            }

            // Добавим безопасное возвращение для непредусмотренных типов
            return {
              local: specifier.local?.name || "unknown",
              imported: "unknown",
            };
          });

          result.imports.push({
            path: importSource,
            specifiers: importSpecifiers,
          });
        },
        // Добавляем парсинг объявлений декларации модулей (для .d.ts файлов)
        TSModuleDeclaration(path) {
          if (isDeclarationFile) {
            const moduleName =
              path.node.id.type === "StringLiteral"
                ? path.node.id.value
                : path.node.id.name;

            result.modules[moduleName] = {
              type: "module",
              path: filePath,
            };
          }
        },
      });

      // Пропускаем дальнейший обход для .d.ts файлов, т.к. там нет компонентов или хуков
      if (isDeclarationFile) {
        return;
      }

      // Основной обход AST - только для не-декларативных файлов
      traverse(ast, {
        // Обработка переменных
        VariableDeclarator(path) {
          const varName = path.node.id.name;

          // Проверяем, является ли переменная компонентом
          const isComponent =
            isArrowFunctionComponent(path) || isFunctionComponent(path);

          if (isComponent) {
            // Обрабатываем как функцию/компонент
            const componentInfo = {
              params: [],
              returnResult: ["JSX.Element"],
              genericsTypes: [],
              jsx: true,
              body: path.node.init?.loc
                ? code.slice(path.node.init.start, path.node.init.end)
                : undefined,
            };

            // Добавляем параметры, если есть
            if (
              path.node.init &&
              path.node.init.params &&
              path.node.init.params.length > 0
            ) {
              componentInfo.params = path.node.init.params.map((param) => {
                const paramName = param.name || (param.left && param.left.name);
                const paramType = param.typeAnnotation
                  ? safeGetTSType(param.typeAnnotation.typeAnnotation)
                  : "any";

                return { name: paramName || "param", type: paramType };
              });
            }

            // Добавляем декораторы
            const decorators = parseDecorators(path);
            if (decorators.length > 0) {
              componentInfo.decorators = decorators;
            }

            // Добавляем декораторы параметров
            const paramDecorators = parseParamDecorators(path);
            if (paramDecorators.length > 0) {
              componentInfo.paramDecorators = paramDecorators;
            }

            result.functions[varName] = componentInfo;
          } else if (path.node.init) {
            // Обычная переменная
            let varType = "any";

            // Сначала проверяем TypeScript аннотацию типа
            if (path.node.id.typeAnnotation) {
              varType = safeGetTSType(
                path.node.id.typeAnnotation.typeAnnotation
              );
            } else {
              // Если нет аннотации типа, определяем тип по инициализатору
              varType = getType(path.node.init);
            }

            // Определяем тип объявления переменной
            let declarationType = "var"; // по умолчанию
            if (path.parent && path.parent.kind === "const") {
              declarationType = "const";
            } else if (path.parent && path.parent.kind === "let") {
              declarationType = "let";
            }

            result.variables[varName] = {
              types: [varType],
              value: path.node.init.loc
                ? code.slice(path.node.init.start, path.node.end)
                : undefined,
              declarationType: declarationType, // Добавляем тип объявления
              isDeclared: false,
              isExported: getCommonModifiers(path.node, path).isExported,
            };
          } else {
            // Переменная без инициализации
            let varType = "any";

            // Проверяем TypeScript аннотацию типа даже без инициализатора
            if (path.node.id.typeAnnotation) {
              varType = safeGetTSType(
                path.node.id.typeAnnotation.typeAnnotation
              );
            }

            // Определяем тип объявления переменной
            let declarationType = "var"; // по умолчанию
            if (path.parent && path.parent.kind === "const") {
              declarationType = "const";
            } else if (path.parent && path.parent.kind === "let") {
              declarationType = "let";
            }

            result.variables[varName] = {
              types: [varType],
              value: undefined,
              declarationType: declarationType, // Добавляем тип объявления
              isDeclared: false,
              isExported: getCommonModifiers(path.node, path).isExported,
            };
          }
        },

        // Обработка классовых компонентов
        ClassDeclaration(path) {
          if (isReactClassComponent(path)) {
            const className = path.node.id?.name;
            if (!className) return; // Пропускаем, если нет имени класса

            // Получаем декораторы класса
            const classDecorators = parseDecorators(path);

            const classModifiers = getCommonModifiers(path.node, path);

            const classInfo = {
              methods: {},
              fields: {},
              constructors: {},
              extendsClass: "React.Component",
              jsx: true,
              isExported: classModifiers.isExported,
              isAbstract: classModifiers.isAbstract,
            };

            // Обрабатываем методы и свойства класса для получения их декораторов
            path.node.body.body.forEach((classMember) => {
              // Получаем декораторы для члена класса
              const memberDecorators = classMember.decorators
                ? parseDecorators({ node: classMember })
                : [];

              if (t.isClassMethod(classMember) && classMember.key) {
                const methodName = classMember.key.name;
                const methodModifiers = getCommonModifiers(classMember, {
                  parent: path,
                });

                // Добавляем метод, если его еще нет
                if (!classInfo.methods[methodName]) {
                  classInfo.methods[methodName] = {
                    returnType: classMember.returnType
                      ? safeGetTSType(classMember.returnType.typeAnnotation)
                      : "any",
                    accessModifier: methodModifiers.accessModifier,
                    isStatic: methodModifiers.isStatic,
                    isAsync: methodModifiers.isAsync,
                    isAbstract: methodModifiers.isAbstract,
                    isOverride: methodModifiers.isOverride,
                  };
                }

                // Добавляем декораторы метода
                if (memberDecorators.length > 0) {
                  classInfo.methods[methodName].decorators = memberDecorators;
                }

                // Добавляем декораторы параметров
                if (classMember.params && classMember.params.length > 0) {
                  const paramDecorators = [];

                  classMember.params.forEach((param, index) => {
                    if (param.decorators && param.decorators.length > 0) {
                      paramDecorators.push({
                        index,
                        name: param.name ? param.name.name : "param",
                        decorators: parseDecorators({ node: param }),
                      });
                    }
                  });

                  if (paramDecorators.length > 0) {
                    classInfo.methods[methodName].paramDecorators =
                      paramDecorators;
                  }
                }
              } else if (t.isClassProperty(classMember) && classMember.key) {
                const propertyName = classMember.key.name;
                const propertyModifiers = getCommonModifiers(classMember, {
                  parent: path,
                });

                // Добавляем свойство
                classInfo.fields[propertyName] = {
                  type: classMember.typeAnnotation
                    ? safeGetTSType(classMember.typeAnnotation.typeAnnotation)
                    : "any",
                  accessModifier: propertyModifiers.accessModifier,
                  isStatic: propertyModifiers.isStatic,
                  isReadonly: propertyModifiers.isReadonly,
                  isAbstract: propertyModifiers.isAbstract,
                  isOverride: propertyModifiers.isOverride,
                };

                // Добавляем декораторы свойства
                if (memberDecorators.length > 0) {
                  classInfo.fields[propertyName].decorators = memberDecorators;
                }
              }
            });

            // Добавляем декораторы класса
            if (classDecorators.length > 0) {
              classInfo.decorators = classDecorators;
            }

            result.classes[className] = classInfo;
          }
        },

        // Обработка компонентов объявленных через function Component() {}
        FunctionDeclaration(path) {
          if (isFunctionDeclarationComponent(path)) {
            const funcName = path.node.id?.name;
            if (!funcName) return; // Пропускаем, если нет имени функции

            // Получаем декораторы функции
            const funcDecorators = parseDecorators(path);

            const functionInfo = {
              params:
                path.node.params?.map((param) => {
                  const paramName =
                    param.name || (param.left && param.left.name);
                  const paramType = param.typeAnnotation
                    ? safeGetTSType(param.typeAnnotation.typeAnnotation)
                    : "any";

                  return { name: paramName || "param", type: paramType };
                }) || [],
              returnResult: ["JSX.Element"],
              genericsTypes: [],
              jsx: true,
              body:
                path.node.body &&
                code.slice(path.node.body.start, path.node.body.end),
              isExported: getCommonModifiers(path.node, path).isExported,
            };

            // Добавляем декораторы функции
            if (funcDecorators.length > 0) {
              functionInfo.decorators = funcDecorators;
            }

            // Добавляем декораторы параметров
            const paramDecorators = parseParamDecorators(path);
            if (paramDecorators.length > 0) {
              functionInfo.paramDecorators = paramDecorators;
            }

            result.functions[funcName] = functionInfo;
          }
        },
      });
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
    }
  });

  return result;
}

// Безопасная функция для получения типа с проверкой на undefined
function safeGetTSType(node) {
  try {
    if (!node) return "any";
    return getTSType(node);
  } catch (error) {
    console.error("Ошибка при получении типа:", error.message);
    return "any";
  }
}

module.exports = { parseReact };
