const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const { getFileExtension } = require("../utils/fileExtensions");
const { createModuleStubs } = require("./moduleStubs");

/**
 * Создает конфигурацию TypeScript для временного проекта
 * @returns {Object} конфигурация tsconfig.json
 */
function createTsConfig() {
  return {
    compilerOptions: {
      target: "ES2022",
      module: "commonjs",
      moduleResolution: "node",
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: "react-jsx",
      jsxImportSource: "react",
      baseUrl: ".",
      typeRoots: ["./node_modules/@types", "./node_modules"],
      paths: {
        "*": ["./node_modules/*", "./*"],
      },
      allowImportingTsExtensions: false,
      noEmit: true,
      resolveJsonModule: true,
      isolatedModules: false,
      allowJs: true,
      checkJs: false,
      moduleDetection: "auto",
      types: [],
      skipDefaultLibCheck: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    },
    include: ["./**/*"],
    exclude: ["node_modules"],
  };
}

/**
 * Создает package.json для временного проекта
 * @returns {Object} конфигурация package.json
 */
function createPackageJson() {
  return {
    name: "temp-project",
    version: "1.0.0",
    dependencies: {
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.0",
      react: "^18.0.0",
      "react-dom": "^18.0.0",
    },
    devDependencies: {
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      "@types/node": "^18.0.0",
    },
  };
}

/**
 * Создает глобальные типы из .d.ts файлов
 * @param {Object} files - файлы проекта
 * @param {string} tempDirPath - путь к временной директории
 * @returns {string|null} путь к файлу глобальных типов или null
 */
function createGlobalTypes(files, tempDirPath) {
  const globalDeclarations = [];

  Object.entries(files).forEach(([filename, content]) => {
    const extension = getFileExtension(filename);
    if (extension === "d.ts") {
      // Извлекаем глобальные декларации из .d.ts файлов
      const globalMatch = content.match(/declare global\s*\{([^}]+)\}/s);
      if (globalMatch) {
        globalDeclarations.push(globalMatch[1].trim());
      }
    }
  });

  // Создаем единый файл глобальных типов
  if (globalDeclarations.length > 0) {
    const globalTypes = `declare global {\n  ${globalDeclarations.join(
      "\n  "
    )}\n}\n\nexport {};`;
    const globalTypesPath = path.join(tempDirPath, "global.d.ts");
    fs.writeFileSync(globalTypesPath, globalTypes);
    return globalTypesPath;
  }

  return null;
}

/**
 * Создает временную директорию со всеми файлами проекта
 * @param {Object} files - объект с файлами {filename: content}
 * @returns {Object} информация о временной директории
 */
function createTempProject(files) {
  const tempDir = tmp.dirSync({ unsafeCleanup: true });
  const fileMap = {};

  // Создаем tsconfig.json во временной директории
  const tsConfig = createTsConfig();
  fs.writeFileSync(
    path.join(tempDir.name, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );

  // Создаем package.json во временной директории
  const packageJson = createPackageJson();
  fs.writeFileSync(
    path.join(tempDir.name, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // Создаем node_modules с заглушками для популярных модулей
  const nodeModulesDir = path.join(tempDir.name, "node_modules");
  fs.mkdirSync(nodeModulesDir, { recursive: true });
  createModuleStubs(nodeModulesDir);

  // Создаем глобальные типы из всех .d.ts файлов
  const globalTypesPath = createGlobalTypes(files, tempDir.name);
  if (globalTypesPath) {
    fileMap["global.d.ts"] = globalTypesPath;
  }

  // Записываем пользовательские файлы
  Object.entries(files).forEach(([filename, content]) => {
    const fullPath = path.join(tempDir.name, filename);
    const dir = path.dirname(fullPath);

    // Создаем директории если нужно
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    fileMap[filename] = fullPath;
  });

  return {
    tempDir,
    fileMap,
    cleanup: () => tempDir.removeCallback(),
  };
}

module.exports = {
  createTempProject,
  createTsConfig,
  createPackageJson,
  createGlobalTypes,
};
