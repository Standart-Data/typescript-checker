const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим компонент
const result = parseReact([path.join(__dirname, "main.jsx")]);

describe("Функциональный компонент SimpleComponent:", function () {
  it("Компонент определен", function () {
    assert.ok(
      result.components.SimpleComponent,
      "SimpleComponent не найден в результатах парсинга"
    );
  });

  it("Компонент является функциональным", function () {
    assert.equal(
      result.components.SimpleComponent.type,
      "functional",
      "SimpleComponent должен быть функциональным компонентом"
    );
  });

  it("Компонент использует хук useState", function () {
    const hasUseState = result.components.SimpleComponent.hooks.some(
      (hook) => hook.name === "useState"
    );
    assert.ok(hasUseState, "SimpleComponent должен использовать хук useState");
  });

  it("Компонент использует хук useEffect", function () {
    const hasUseEffect = result.components.SimpleComponent.hooks.some(
      (hook) => hook.name === "useEffect"
    );
    assert.ok(
      hasUseEffect,
      "SimpleComponent должен использовать хук useEffect"
    );
  });

  it("Компонент принимает props", function () {
    assert.ok(
      result.components.SimpleComponent.props.length > 0,
      "SimpleComponent должен принимать пропсы"
    );
  });

  it("Компонент возвращает JSX", function () {
    assert.ok(
      result.components.SimpleComponent.returns,
      "SimpleComponent должен возвращать JSX"
    );
  });
});
