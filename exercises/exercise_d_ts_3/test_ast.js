const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "./main.d.ts")]);
console.log(allVariables);

describe("Модуль 'data-service':", function () {
  it("Объявлен модуль 'data-service'", function () {
    assert.ok(
      allVariables.modules && allVariables.modules["data-service"],
      "Модуль 'data-service' не найден"
    );
  });

  // Проверка функции getData
  it("Модуль содержит функцию getData<T>", function () {
    const hasGetDataFunction = Object.keys(allVariables.functions).some((key) =>
      key.includes("getData")
    );

    assert.ok(
      hasGetDataFunction,
      "Функция getData не найдена в модуле 'data-service'"
    );
  });

  it("Функция getData имеет правильную сигнатуру", function () {
    // Ищем функцию getData в основной секции functions или в модуле
    const getDataFunc =
      allVariables.functions["getData"] ||
      (allVariables.modules &&
        allVariables.modules["data-service"] &&
        allVariables.modules["data-service"].functions &&
        allVariables.modules["data-service"].functions["getData"]);

    assert.ok(getDataFunc, "Функция getData не найдена");

    // Проверяем параметр id
    assert.ok(
      getDataFunc.parameters &&
        getDataFunc.parameters.some(
          (p) => p.name === "id" && p.type === "string"
        ),
      "getData должна принимать параметр id типа string"
    );

    // Проверяем возвращаемый тип
    assert.ok(
      getDataFunc.returnType && getDataFunc.returnType.includes("Promise<T>"),
      "getData должна возвращать Promise<T>"
    );
  });

  // Проверка интерфейса ServiceConfig
  it("Модуль содержит интерфейс ServiceConfig", function () {
    // Ищем интерфейс ServiceConfig в основной секции interfaces или в модуле
    const serviceConfig =
      allVariables.interfaces["ServiceConfig"] ||
      (allVariables.modules &&
        allVariables.modules["data-service"] &&
        allVariables.modules["data-service"].interfaces &&
        allVariables.modules["data-service"].interfaces["ServiceConfig"]);

    assert.ok(serviceConfig, "Интерфейс ServiceConfig не найден");
  });

  it("ServiceConfig имеет правильные поля", function () {
    const serviceConfig =
      allVariables.interfaces["ServiceConfig"] ||
      (allVariables.modules &&
        allVariables.modules["data-service"] &&
        allVariables.modules["data-service"].interfaces &&
        allVariables.modules["data-service"].interfaces["ServiceConfig"]);

    assert.ok(serviceConfig, "Интерфейс ServiceConfig не найден");

    assert.ok(
      serviceConfig.properties["apiUrl"] &&
        serviceConfig.properties["apiUrl"].type === "string",
      "ServiceConfig должен содержать поле apiUrl типа string"
    );

    assert.ok(
      serviceConfig.properties["timeout"] &&
        serviceConfig.properties["timeout"].type === "number",
      "ServiceConfig должен содержать поле timeout типа number"
    );
  });

  // Проверка класса DataManager
  it("Модуль содержит класс DataManager", function () {
    const hasDataManagerClass = Object.keys(allVariables.classes).some((key) =>
      key.includes("DataManager")
    );

    assert.ok(
      hasDataManagerClass,
      "Класс DataManager не найден в модуле 'data-service'"
    );
  });
});

describe("Пространство имен API:", function () {
  it("Объявлено пространство имен API", function () {
    // Проверяем наличие пространства имен API в секции namespaces
    assert.ok(
      allVariables.namespaces && allVariables.namespaces["API"],
      "Пространство имен API не найдено"
    );
  });

  // Проверка функции request
  it("API содержит функцию request<T>", function () {
    // Ищем функцию request в пространстве имен API
    const requestFunc =
      allVariables.functions["request"] ||
      (allVariables.namespaces &&
        allVariables.namespaces["API"] &&
        allVariables.namespaces["API"].functions &&
        allVariables.namespaces["API"].functions["request"]);

    assert.ok(
      requestFunc,
      "Функция request не найдена в пространстве имен API"
    );
  });

  it("Функция request имеет правильную сигнатуру", function () {
    // Ищем функцию request в пространстве имен API
    const requestFunc =
      allVariables.functions["request"] ||
      (allVariables.namespaces &&
        allVariables.namespaces["API"] &&
        allVariables.namespaces["API"].functions &&
        allVariables.namespaces["API"].functions["request"]);

    assert.ok(requestFunc, "Функция request не найдена");

    // Проверяем параметры
    const hasEndpointParam =
      requestFunc.parameters &&
      requestFunc.parameters.some(
        (p) => p.name === "endpoint" && p.type === "string"
      );

    const hasMethodParam =
      requestFunc.parameters &&
      requestFunc.parameters.some(
        (p) =>
          p.name === "method" &&
          p.type.includes('"GET"') &&
          p.type.includes('"POST"')
      );

    assert.ok(
      hasEndpointParam && hasMethodParam,
      "request должна принимать параметры endpoint типа string и method типа 'GET'|'POST'"
    );

    // Проверяем возвращаемый тип
    assert.ok(
      requestFunc.returnType && requestFunc.returnType.includes("Promise<T>"),
      "request должна возвращать Promise<T>"
    );
  });

  // Проверка интерфейса ErrorResponse
  it("API содержит интерфейс ErrorResponse", function () {
    // Ищем интерфейс ErrorResponse в пространстве имен API
    const errorResponse =
      allVariables.interfaces["ErrorResponse"] ||
      (allVariables.namespaces &&
        allVariables.namespaces["API"] &&
        allVariables.namespaces["API"].interfaces &&
        allVariables.namespaces["API"].interfaces["ErrorResponse"]);

    assert.ok(
      errorResponse,
      "Интерфейс ErrorResponse не найден в пространстве имен API"
    );
  });

  it("ErrorResponse имеет правильные поля", function () {
    // Ищем интерфейс ErrorResponse в пространстве имен API
    const errorResponseInterface =
      allVariables.interfaces["ErrorResponse"] ||
      (allVariables.namespaces &&
        allVariables.namespaces["API"] &&
        allVariables.namespaces["API"].interfaces &&
        allVariables.namespaces["API"].interfaces["ErrorResponse"]);

    assert.ok(errorResponseInterface, "Интерфейс ErrorResponse не найден");

    // Проверяем поля
    assert.ok(
      errorResponseInterface.properties["code"] &&
        errorResponseInterface.properties["code"].type === "number",
      "ErrorResponse должен содержать поле code типа number"
    );

    assert.ok(
      errorResponseInterface.properties["message"] &&
        errorResponseInterface.properties["message"].type === "string",
      "ErrorResponse должен содержать поле message типа string"
    );
  });
});
