const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим компонент
const result = parseReact([path.join(__dirname, "main.jsx")]);

describe("Стрелочный компонент ArrowComponent:", function () {
  it("Компонент определен", function () {
    assert.ok(
      result.components.ArrowComponent,
      "ArrowComponent не найден в результатах парсинга"
    );
  });

  it("Компонент является функциональным", function () {
    assert.equal(
      result.components.ArrowComponent.type,
      "functional",
      "ArrowComponent должен быть функциональным компонентом"
    );
  });

  it("Компонент использует деструктуризацию props", function () {
    // Проверяем наличие деструктуризованных props
    const propsNames = result.components.ArrowComponent.props.map(
      (prop) => prop.name
    );

    assert.ok(
      propsNames.includes("name") && propsNames.includes("age"),
      "ArrowComponent должен использовать деструктуризацию props ({ name, age })"
    );
  });

  it("Компонент использует хук useState", function () {
    const hasUseState = result.components.ArrowComponent.hooks.some(
      (hook) => hook.name === "useState"
    );
    assert.ok(hasUseState, "ArrowComponent должен использовать хук useState");
  });

  it("Компонент содержит условный рендеринг", function () {
    const jsxContent = result.components.ArrowComponent.returns;
    assert.ok(
      jsxContent.includes("&&") || jsxContent.includes("?"),
      "ArrowComponent должен использовать условный рендеринг"
    );
  });

  it("Компонент имеет обработчик события onClick", function () {
    const jsxContent = result.components.ArrowComponent.returns;
    assert.ok(
      jsxContent.includes("onClick="),
      "ArrowComponent должен использовать обработчик события onClick"
    );
  });
});
