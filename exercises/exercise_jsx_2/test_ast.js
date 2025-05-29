const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

// Парсим компонент
const result = parseReact([path.join(__dirname, "main.jsx")]);

describe("Классовый компонент ClassComponent:", function () {
  it("Компонент определен", function () {
    assert.ok(
      result.components.ClassComponent,
      "ClassComponent не найден в результатах парсинга"
    );
  });

  it("Компонент является классовым", function () {
    assert.equal(
      result.components.ClassComponent.type,
      "class",
      "ClassComponent должен быть классовым компонентом"
    );
  });

  it("Компонент имеет метод render", function () {
    assert.ok(
      result.components.ClassComponent.returns,
      "ClassComponent должен иметь метод render, возвращающий JSX"
    );
  });

  it("ClassComponent должен использовать состояние", function () {
    const componentCode = result.components.ClassComponent.code;
    assert.ok(
      componentCode.includes("this.state"),
      "ClassComponent должен использовать состояние (this.state)"
    );
  });

  it("Компонент имеет метод для изменения состояния", function () {
    const componentCode = result.components.ClassComponent.code;
    assert.ok(
      componentCode.includes("this.setState"),
      "ClassComponent должен использовать this.setState для изменения состояния"
    );
  });

  it("Компонент имеет метод жизненного цикла", function () {
    const componentCode = result.components.ClassComponent.code;
    assert.ok(
      componentCode.includes("componentDidMount"),
      "ClassComponent должен реализовывать метод жизненного цикла componentDidMount"
    );
  });
});
