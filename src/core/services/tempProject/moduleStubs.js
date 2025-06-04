const fs = require("fs");
const path = require("path");
const { getStub } = require("./stubs");

/**
 * Список популярных модулей для создания заглушек
 */
const COMMON_MODULES = [
  "class-transformer",
  "class-validator",
  "reflect-metadata",
  "express",
  "lodash",
  "moment",
  "axios",
  "uuid",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "react",
  "react-dom",
  "react-hook-form",
];

/**
 * Создает детальные типы для конкретного модуля
 * @param {string} moduleName - имя модуля
 * @returns {string} определения типов
 */
function createTypeDefinition(moduleName) {
  return getStub(moduleName);
}

/**
 * Создает заглушки модулей в node_modules
 * @param {string} nodeModulesDir - путь к директории node_modules
 */
function createModuleStubs(nodeModulesDir) {
  const typesDir = path.join(nodeModulesDir, "@types");
  fs.mkdirSync(typesDir, { recursive: true });

  COMMON_MODULES.forEach((moduleName) => {
    const moduleDir = path.join(nodeModulesDir, moduleName);
    fs.mkdirSync(moduleDir, { recursive: true });

    // Создаем детальный package.json для каждого модуля
    const modulePackageJson = {
      name: moduleName,
      version: "1.0.0",
      main: "./index.js",
      types: "./index.d.ts",
      typings: "./index.d.ts",
      exports: {
        ".": {
          types: "./index.d.ts",
          import: "./index.mjs",
          require: "./index.js",
        },
      },
    };

    fs.writeFileSync(
      path.join(moduleDir, "package.json"),
      JSON.stringify(modulePackageJson, null, 2)
    );

    // Создаем типы
    const typeDefinition = createTypeDefinition(moduleName);
    fs.writeFileSync(path.join(moduleDir, "index.d.ts"), typeDefinition);

    // Создаем минимальный index.js
    const indexJs = `// ${moduleName} stub\nmodule.exports = {};`;
    fs.writeFileSync(path.join(moduleDir, "index.js"), indexJs);

    // Создаем index.mjs для ES modules
    const indexMjs = `// ${moduleName} ES module stub\nexport default {};`;
    fs.writeFileSync(path.join(moduleDir, "index.mjs"), indexMjs);

    // Также создаем типы в @types директории для лучшего разрешения
    if (!moduleName.startsWith("@types/")) {
      const typesModuleDir = path.join(typesDir, moduleName);
      fs.mkdirSync(typesModuleDir, { recursive: true });

      fs.writeFileSync(
        path.join(typesModuleDir, "package.json"),
        JSON.stringify(
          {
            name: `@types/${moduleName}`,
            version: "1.0.0",
            types: "index.d.ts",
            typings: "index.d.ts",
          },
          null,
          2
        )
      );

      fs.writeFileSync(path.join(typesModuleDir, "index.d.ts"), typeDefinition);
    }
  });
}

module.exports = {
  COMMON_MODULES,
  createTypeDefinition,
  createModuleStubs,
};
