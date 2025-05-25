// Импорты для тестирования
const { parseTypeScript, parseReact, getParser } = require("../../src");
const assert = require("assert");
const path = require("path");

// Используем абсолютные пути для файлов
const APP_TS_PATH = path.join(__dirname, "app.ts");
const TYPES_DTS_PATH = path.join(__dirname, "types.d.ts");
const COMPONENTS_TSX_PATH = path.join(__dirname, "components.tsx");

// Создаем объект allVariables для хранения результатов парсинга нескольких файлов
const allVariables = {
  files: {},
};

const appTsMetadata = parseTypeScript([APP_TS_PATH]);
allVariables.files["app.ts"] = appTsMetadata;

const typesDtsMetadata = parseTypeScript([TYPES_DTS_PATH]); // Используем parseTypeScript для .d.ts
allVariables.files["types.d.ts"] = typesDtsMetadata;

const tsxParser = getParser("tsx");
const componentsTsxMetadata = tsxParser([COMPONENTS_TSX_PATH]);
allVariables.files["components.tsx"] = componentsTsxMetadata;

Object.keys(appTsMetadata).forEach((key) => {
  if (key !== "files") {
    allVariables[key] = appTsMetadata[key];
  }
});

console.log(JSON.stringify(allVariables, null, 2));

describe("Тестирование разных типов TypeScript файлов", function () {
  it("Проверка структуры в app.ts", function () {
    const appFile = allVariables.files["app.ts"];
    assert.ok(appFile, "Файл app.ts не найден в allVariables.files");
    assert.ok(appFile.variables?.user, "Переменная user не найдена в app.ts");
    assert.ok(
      appFile.functions?.checkAccess,
      "Функция checkAccess не найдена в app.ts"
    );
    assert.ok(
      appFile.functions?.displayUserInfo,
      "Функция displayUserInfo не найдена в app.ts"
    );
  });

  it("Проверка типов в types.d.ts", function () {
    const typesFile = allVariables.files["types.d.ts"];
    assert.ok(typesFile, "Файл types.d.ts не найден в allVariables.files");
    assert.ok(
      typesFile.interfaces?.User,
      "Интерфейс User не найден в types.d.ts"
    );
    assert.ok(
      typesFile.interfaces?.User?.properties?.id,
      "Свойство id в интерфейсе User не найдено"
    );
    assert.ok(
      typesFile.interfaces?.User?.properties?.role,
      "Свойство role в интерфейсе User не найдено"
    );
    assert.ok(
      typesFile.types?.AppConfig,
      "Тип AppConfig не найден в types.d.ts"
    );

    // Проверка enum
    assert.ok(typesFile.enums?.UserRole, "Перечисление UserRole не найдено");
    assert.ok(
      typesFile.enums?.UserRole?.members.some((m) => m.name === "USER"),
      "Член USER в перечислении не найден"
    );
    assert.ok(
      typesFile.enums?.UserRole?.members.some((m) => m.name === "MODERATOR"),
      "Член MODERATOR в перечислении не найден"
    );
    assert.ok(
      typesFile.enums?.UserRole?.members.some((m) => m.name === "ADMIN"),
      "Член ADMIN в перечислении не найден"
    );

    const showNotificationDecl =
      typesFile.functions?.showNotification ||
      typesFile.declarations?.showNotification;
    assert.ok(showNotificationDecl, "Декларация showNotification не найдена");
  });

  it("Проверка React компонентов в components.tsx", function () {
    const componentsFile = allVariables.files["components.tsx"];
    assert.ok(
      componentsFile,
      "Файл components.tsx не найден в allVariables.files"
    );

    assert.ok(
      componentsFile.interfaces?.UserCardProps,
      "Интерфейс UserCardProps не найден"
    );

    const userCardProps = componentsFile.interfaces?.UserCardProps;
    assert.ok(userCardProps, "UserCardProps не определен");
    assert.ok(
      userCardProps.properties?.user,
      "Свойство user в UserCardProps не найдено"
    );
    assert.ok(
      userCardProps.properties?.showEmail,
      "Свойство showEmail в UserCardProps не найдено"
    );
    assert.ok(
      userCardProps.properties?.onEdit,
      "Свойство onEdit в UserCardProps не найдено"
    );

    let userCardFound =
      componentsFile.functions?.UserCard ||
      componentsFile.exports?.UserCard ||
      componentsFile.variables?.UserCard;
    let userListFound =
      componentsFile.functions?.UserList ||
      componentsFile.exports?.UserList ||
      componentsFile.variables?.UserList;

    assert.ok(userCardFound, "Компонент UserCard не найден");
    assert.ok(userListFound, "Компонент UserList не найден");
  });

  it("Проверка связей между файлами", function () {
    assert.ok(
      allVariables.files["app.ts"],
      "Файл app.ts должен быть добавлен в структуру"
    );
    assert.ok(
      allVariables.files["types.d.ts"],
      "Файл types.d.ts должен быть добавлен в структуру"
    );
    assert.ok(
      allVariables.files["components.tsx"],
      "Файл components.tsx должен быть добавлен в структуру"
    );
    assert.ok(true, "Все файлы найдены в структуре");
  });

  it("Проверка обратной совместимости", function () {
    assert.ok(
      allVariables.variables,
      "allVariables.variables не существует (ожидаются из app.ts)"
    );
    assert.ok(
      allVariables.functions,
      "allVariables.functions не существует (ожидаются из app.ts)"
    );
    assert.ok(
      allVariables.variables.user,
      "allVariables.variables.user не существует"
    );
    assert.ok(
      allVariables.functions.checkAccess,
      "allVariables.functions.checkAccess не существует"
    );
  });
});
