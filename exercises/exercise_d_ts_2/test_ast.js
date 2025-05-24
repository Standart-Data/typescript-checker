// Импорты для тестирования
const { readTsFiles } = require("../../parse");
const assert = require("assert");

// Парсим d.ts файл
const allTypes = readTsFiles(["./main.d.ts"]);
console.log(allTypes, "parsed types");

describe("Интерфейс ApiResponse:", function () {
  it("Создан дженерик-интерфейс ApiResponse", function () {
    assert.ok(
      allTypes.interfaces["ApiResponse"],
      "Интерфейс ApiResponse не найден"
    );
  });

  it("ApiResponse имеет параметр типа T", function () {
    // Проверяем наличие T в свойствах интерфейса
    assert.ok(
      Object.values(allTypes.interfaces["ApiResponse"].properties).some(
        (prop) => prop.includes("T")
      ),
      "ApiResponse должен быть дженерик-интерфейсом с параметром типа T"
    );
  });

  it("ApiResponse содержит поле data типа T", function () {
    assert.ok(
      allTypes.interfaces["ApiResponse"].properties["data"],
      "Поле data не найдено"
    );

    assert.ok(
      allTypes.interfaces["ApiResponse"].properties["data"].includes("T"),
      "Поле data должно быть типа T"
    );
  });

  it("ApiResponse содержит поле status типа number", function () {
    assert.equal(
      allTypes.interfaces["ApiResponse"].properties["status"],
      "number",
      "Поле status должно быть типа number"
    );
  });

  it("ApiResponse содержит поле message типа string", function () {
    assert.equal(
      allTypes.interfaces["ApiResponse"].properties["message"],
      "string",
      "Поле message должно быть типа string"
    );
  });
});

describe("Интерфейс RequestOptions:", function () {
  it("Создан интерфейс RequestOptions", function () {
    assert.ok(
      allTypes.interfaces["RequestOptions"],
      "Интерфейс RequestOptions не найден"
    );
  });

  it("RequestOptions содержит опциональное поле headers", function () {
    assert.ok(
      allTypes.interfaces["RequestOptions"].properties["headers"],
      "Поле headers не найдено"
    );

    assert.ok(
      allTypes.interfaces["RequestOptions"].properties["headers"].includes(
        "Record<string, string>"
      ),
      "Поле headers должно быть типа Record<string, string>"
    );
  });

  it("RequestOptions содержит опциональное поле timeout типа number", function () {
    assert.ok(
      allTypes.interfaces["RequestOptions"].properties["timeout"],
      "Поле timeout не найдено"
    );

    assert.equal(
      allTypes.interfaces["RequestOptions"].properties["timeout"],
      "number",
      "Поле timeout должно быть типа number"
    );
  });

  it("RequestOptions содержит опциональное поле cache с допустимыми значениями", function () {
    assert.ok(
      allTypes.interfaces["RequestOptions"].properties["cache"],
      "Поле cache не найдено"
    );

    const cacheType = allTypes.interfaces["RequestOptions"].properties["cache"];

    assert.ok(
      cacheType.includes("default") &&
        cacheType.includes("no-cache") &&
        cacheType.includes("reload"),
      "Поле cache должно быть union типом 'default' | 'no-cache' | 'reload'"
    );
  });
});

describe("Функция fetchData:", function () {
  it("Объявлена функция fetchData", function () {
    assert.ok(allTypes.functions["fetchData"], "Функция fetchData не найдена");
  });

  it("fetchData имеет дженерик-параметр T", function () {
    const fetchDataFunc = allTypes.functions["fetchData"];

    // Проверяем, есть ли у функции обобщенные типы
    const hasGeneric =
      fetchDataFunc.overload0 &&
      fetchDataFunc.overload0.genericsTypes &&
      fetchDataFunc.overload0.genericsTypes.includes("T");

    assert.ok(
      hasGeneric,
      "fetchData должна быть дженерик-функцией с параметром типа T"
    );
  });

  it("fetchData принимает параметр url типа string", function () {
    const fetchDataFunc = allTypes.functions["fetchData"];

    const hasUrlParam =
      fetchDataFunc.overload0 &&
      fetchDataFunc.overload0.params &&
      fetchDataFunc.overload0.params.some(
        (p) => p.name === "url" && p.type === "string"
      );

    assert.ok(
      hasUrlParam,
      "fetchData должна принимать параметр url типа string"
    );
  });

  it("fetchData принимает опциональный параметр options типа RequestOptions", function () {
    const fetchDataFunc = allTypes.functions["fetchData"];

    const hasOptionsParam =
      fetchDataFunc.overload0 &&
      fetchDataFunc.overload0.params &&
      fetchDataFunc.overload0.params.some(
        (p) =>
          p.name === "options" &&
          p.type === "RequestOptions" &&
          p.optional === true
      );

    assert.ok(
      hasOptionsParam,
      "fetchData должна принимать опциональный параметр options типа RequestOptions"
    );
  });

  it("fetchData возвращает Promise<ApiResponse<T>>", function () {
    const fetchDataFunc = allTypes.functions["fetchData"];

    const returnType =
      fetchDataFunc.overload0 &&
      fetchDataFunc.overload0.returnResult &&
      fetchDataFunc.overload0.returnResult[0];

    assert.ok(
      returnType &&
        returnType.includes("Promise") &&
        returnType.includes("ApiResponse") &&
        returnType.includes("T"),
      "fetchData должна возвращать Promise<ApiResponse<T>>"
    );
  });
});
