const { parseReact } = require('../../parseReact');
const assert = require('assert');
const fs = require('fs');

const result = parseReact(["./main.ts"]);
console.log(result)
describe("React Component Tests", function () {
  it("Должен находить 3 компонента", () => {
    assert.strictEqual(Object.keys(result.components).length, 4);
  });

  it("Корректно парсит стрелочные компоненты", () => {
    ['Header', 'Header1'].forEach(name => {
      assert.ok(result.components[name]);
      assert.match(result.components[name].returns, /<header/);
      assert.match(result.components[name].code, /=>/);
    });
  });

  it("Корректно парсит классовый компонент Car", () => {
    assert.ok(result.components.Car);
    assert.match(result.components.Car.returns, /<div className="car"/);
    assert.match(result.components.Car.code, /class Car/);
  });

  it("Не должен добавлять компоненты в переменные", () => {
    assert.strictEqual(result.variables.Header, undefined);
    assert.strictEqual(result.variables.Header1, undefined);
    assert.strictEqual(result.variables.Car, undefined);
  });
});