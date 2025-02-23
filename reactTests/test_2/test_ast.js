const { parseReact } = require('../../parseReact');
const assert = require('assert');
const fs = require('fs');

const result = parseReact(["./main.ts"]);
console.log(result)
describe("React Component Tests", function () {
  it("Должен находить 2 компонента", () => {
    assert.strictEqual(Object.keys(result.components).length, 2);
  });

  it("Корректно парсит функциональный компонент NavigationMenu", () => {
    const navigationMenu = result.components.NavigationMenu;
    assert.ok(navigationMenu);
    assert.strictEqual(navigationMenu.type, 'function');
    assert.match(navigationMenu.returns, /<nav>/);
    assert.match(navigationMenu.code, /function NavigationMenu/);

    // Проверка состояний
    assert.strictEqual(navigationMenu.states.length, 1);
    assert.deepStrictEqual(navigationMenu.states[0], {
      name: 'used',
      initialValue: 'false'
    });

    // Проверка эффектов
    assert.strictEqual(navigationMenu.effects.length, 1);
    assert.match(navigationMenu.effects[0].code, /useEffect/);
    assert.strictEqual(navigationMenu.effects[0].dependencies, '[]');

    // Проверка обработчиков
    assert.strictEqual(navigationMenu.handlers.length, 1);
    assert.deepStrictEqual(navigationMenu.handlers[0], {
      name: 'handleClick',
      code: 'const handleClick = (e) => {\n    e.preventDefault();\n    setUsed(!used);\n  }'
    });
  });

  it("Корректно парсит функциональный компонент App", () => {
    const app = result.components.App;
    assert.ok(app);
    assert.strictEqual(app.type, 'function');
    assert.match(app.returns, /<div>/);
    assert.match(app.code, /function App/);

    // Проверка переменных
    assert.strictEqual(app.variables.length, 1);
    assert.deepStrictEqual(app.variables[0], {
      name: 'menuItems',
      type: 'object',
      value: '[\n    { Название: "Главная", link: "/" },\n    { Название: "О нас", link: "/about" },\n    { Название: "Услуги", link: "/services" },\n    { Название: "Контакты", link: "/contact" },\n  ]'
    });
  });

  it("Не должен добавлять компоненты в переменные", () => {
    assert.strictEqual(result.variables.NavigationMenu, undefined);
    assert.strictEqual(result.variables.App, undefined);
  });

  it("Корректно парсит возвращаемый JSX для NavigationMenu", () => {
    const navigationMenu = result.components.NavigationMenu;
    assert.match(navigationMenu.returns, /<nav>/);
    assert.match(navigationMenu.returns, /<ul>/);
    assert.match(navigationMenu.returns, /<li key=/);
    assert.match(navigationMenu.returns, /<a href=/);
  });

  it("Корректно парсит возвращаемый JSX для App", () => {
    const app = result.components.App;
    assert.match(app.returns, /<div>/);
    assert.match(app.returns, /<h1>Мое приложение<\/h1>/);
    assert.match(app.returns, /<NavigationMenu/);
  });
});