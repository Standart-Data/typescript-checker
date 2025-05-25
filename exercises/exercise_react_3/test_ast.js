// Импорты для тестирования
const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим TSX файл
const reactInfo = parseReact([path.join(__dirname, "main.tsx")]);

describe("Дженерик тип DataState<T>:", function () {
  it("Создан тип DataState<T>", function () {
    assert.ok(reactInfo.types["DataState"], "Тип DataState<T> не найден");
  });

  it("Тип содержит поле data", function () {
    const dataProperty = reactInfo.types["DataState"].properties?.find(
      (prop) => prop.name === "data"
    );
    assert.ok(dataProperty, "Поле data не найдено в типе DataState");
  });

  it("Тип содержит поле loading типа boolean", function () {
    const loadingProperty = reactInfo.types["DataState"].properties?.find(
      (prop) => prop.name === "loading"
    );
    assert.ok(loadingProperty, "Поле loading не найдено в типе DataState");
    assert.equal(
      loadingProperty.type,
      "boolean",
      "Поле loading должно быть типа boolean"
    );
  });

  it("Тип содержит поле error типа string | null", function () {
    const errorProperty = reactInfo.types["DataState"].properties?.find(
      (prop) => prop.name === "error"
    );
    assert.ok(errorProperty, "Поле error не найдено в типе DataState");
    assert.ok(
      errorProperty.type.includes("string") &&
        errorProperty.type.includes("null"),
      "Поле error должно быть типа string | null"
    );
  });
});

describe("Интерфейс User:", function () {
  it("Создан интерфейс User", function () {
    assert.ok(reactInfo.types["User"], "Интерфейс User не найден");
  });

  it("Интерфейс содержит поле id типа number", function () {
    const idProperty = reactInfo.types["User"].properties?.find(
      (prop) => prop.name === "id"
    );
    assert.ok(idProperty, "Поле id не найдено");
    assert.equal(idProperty.type, "number", "Поле id должно быть типа number");
  });

  it("Интерфейс содержит поле name типа string", function () {
    const nameProperty = reactInfo.types["User"].properties?.find(
      (prop) => prop.name === "name"
    );
    assert.ok(nameProperty, "Поле name не найдено");
    assert.equal(
      nameProperty.type,
      "string",
      "Поле name должно быть типа string"
    );
  });

  it("Интерфейс содержит поле email типа string", function () {
    const emailProperty = reactInfo.types["User"].properties?.find(
      (prop) => prop.name === "email"
    );
    assert.ok(emailProperty, "Поле email не найдено");
    assert.equal(
      emailProperty.type,
      "string",
      "Поле email должно быть типа string"
    );
  });
});

describe("React Context и Provider:", function () {
  it("Создан контекст UserContext", function () {
    const variablesExist = Object.keys(reactInfo.variables).some((name) =>
      name.includes("UserContext")
    );
    assert.ok(variablesExist, "UserContext не найден");
  });

  it("Контекст UserContext имеет корректную типизацию с DataState<User>", function () {
    const code = reactInfo.components["UserProvider"].code;

    const hasCorrectContextType =
      code.includes("createContext<DataState<User>") ||
      code.includes("createContext<DataState<User> & {") ||
      code.includes("React.createContext<DataState<User>");

    assert.ok(
      hasCorrectContextType,
      "UserContext должен быть типизирован как createContext<DataState<User>> или с дополнительными методами"
    );
  });

  it("Создан компонент UserProvider", function () {
    assert.ok(
      reactInfo.components["UserProvider"],
      "Компонент UserProvider не найден"
    );
  });

  it("UserProvider имеет правильную типизацию React.FC", function () {
    const component = reactInfo.components["UserProvider"];
    const componentCode = component.code;

    const hasCorrectTyping =
      componentCode.includes("UserProvider: React.FC") ||
      componentCode.includes("UserProvider: FC") ||
      componentCode.includes("UserProvider: FunctionComponent");

    assert.ok(
      hasCorrectTyping,
      "UserProvider должен быть типизирован как React.FC, FC или FunctionComponent"
    );
  });

  it("UserProvider использует useState с DataState<User>", function () {
    const providerCode = reactInfo.components["UserProvider"].code;
    assert.ok(
      providerCode.includes("useState") &&
        providerCode.includes("data:") &&
        providerCode.includes("loading:") &&
        providerCode.includes("error:"),
      "useState должен использовать структуру соответствующую DataState<User>"
    );
  });

  it("useState в UserProvider имеет правильную типизацию", function () {
    const providerCode = reactInfo.components["UserProvider"].code;

    const hasTypedState =
      providerCode.includes("useState<DataState<User>>") ||
      providerCode.includes("useState<DataState<User> & {") ||
      (providerCode.includes("useState({") &&
        providerCode.includes("} as DataState<User>"));

    assert.ok(
      hasTypedState,
      "useState должен быть типизирован как DataState<User>"
    );
  });

  it("UserProvider содержит типизированные методы", function () {
    const providerCode = reactInfo.components["UserProvider"].code;

    assert.ok(
      providerCode.includes("setUser") &&
        providerCode.includes("setLoading") &&
        providerCode.includes("setError"),
      "Provider должен содержать методы setUser, setLoading и setError"
    );
  });

  it("Методы в UserProvider имеют правильную типизацию", function () {
    const providerCode = reactInfo.components["UserProvider"].code;

    const hasTypedMethods =
      (providerCode.includes("setUser = (user: User)") ||
        providerCode.includes("setUser: (user: User)")) &&
      (providerCode.includes("setLoading = (isLoading: boolean)") ||
        providerCode.includes("setLoading: (isLoading: boolean)")) &&
      (providerCode.includes("setError = (errorMessage: string | null)") ||
        providerCode.includes("setError: (errorMessage: string | null)"));

    assert.ok(
      hasTypedMethods,
      "Методы setUser, setLoading и setError должны быть правильно типизированы"
    );
  });

  it("Создан хук useUserContext", function () {
    const codeHasHook =
      Object.keys(reactInfo.variables).some(
        (name) => name === "useUserContext"
      ) || reactInfo.components["UserProvider"].code.includes("useUserContext");

    assert.ok(codeHasHook, "Хук useUserContext не найден");
  });

  it("Хук useUserContext имеет правильную типизацию", function () {
    const code = reactInfo.components["UserProvider"].code;

    const hasTypedHook =
      code.includes("useUserContext = (): DataState<User>") ||
      code.includes("useUserContext = (): DataState<User> & {") ||
      code.includes("useUserContext(): DataState<User>");

    assert.ok(
      hasTypedHook,
      "Хук useUserContext должен возвращать DataState<User> или DataState<User> с дополнительными методами"
    );
  });
});
