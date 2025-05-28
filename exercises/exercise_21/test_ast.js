const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log(allVariables);

const reqThemesLiterals = ["dark", "light"];
const reqLanguageLiterals = ["ru", "en", "fr"];

describe("Интерфейс AppSettings", function () {
  it("объявлен", function () {
    assert.ok(allVariables.interfaces["AppSettings"]);
  });
  it("содержит необходимые свойства", function () {
    // очищаем литеральные типы от мусора и бьем на массив строк
    const pureThemes = allVariables.interfaces["AppSettings"].properties.theme
      .replace(/['"\s]/g, "")
      .toLowerCase()
      .split("|");
    const pureLanguage = allVariables.interfaces[
      "AppSettings"
    ].properties.language
      .replace(/['"\s]/g, "")
      .toLowerCase()
      .split("|");

    //Функция для проверки содержания всех значений
    const hasAllreqParams = (reqParams, params) => {
      return reqParams.every((value) => params.includes(value));
    };

    const themeLiteralsIsCorrect = hasAllreqParams(
      reqThemesLiterals,
      pureThemes
    );
    const languageLiteralsIsCorrect = hasAllreqParams(
      reqLanguageLiterals,
      pureLanguage
    );
    assert.ok(
      allVariables.interfaces["AppSettings"].properties.theme,
      "свойство theme не найдено"
    );
    assert.ok(
      allVariables.interfaces["AppSettings"].properties.language,
      "свойство language не найдено"
    );
    assert.ok(
      allVariables.interfaces["AppSettings"].properties.notifications,
      "свойство notifications не найдено"
    );
    assert.ok(themeLiteralsIsCorrect, "свойство theme неверно типизировано");
    assert.ok(
      languageLiteralsIsCorrect,
      "свойство language неверно типизировано"
    );
    assert.strictEqual(
      allVariables.interfaces["AppSettings"].properties.notifications,
      "boolean",
      "свойство notifications неверно типизировано"
    );
  });
});
describe("Объект дефолтных настроек", function () {
  it("объявлен", function () {
    assert.ok(allVariables.variables["defaultSettings"]);
  });
  it("корректно типизирован", function () {
    assert.strictEqual(
      allVariables.variables["defaultSettings"].types[0],
      "AppSettings"
    );
    assert.ok(
      allVariables.variables["defaultSettings"].value.includes("as const"),
      "константная типизация не найдена"
    );
  });
});
describe("Объект пользовательских настроек", function () {
  it("объявлен", function () {
    assert.ok(allVariables.variables["userSettings"]);
  });
  it("корректно типизирован", function () {
    assert.strictEqual(
      allVariables.variables["userSettings"].types[0],
      "AppSettings"
    );
  });
});
