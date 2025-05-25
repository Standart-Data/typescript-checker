// Импорты для тестирования
const { parseReact } = require("../../parseReact");
const assert = require("assert");

// Парсим TSX файл
const reactInfo = parseReact(["./main.tsx"]);

describe("Интерфейс Task:", function () {
  it("Создан интерфейс Task", function () {
    assert.ok(reactInfo.types["Task"], "Интерфейс Task не найден");
  });

  it("Интерфейс содержит поле id типа number", function () {
    const idProperty = reactInfo.types["Task"].properties.find(
      (prop) => prop.name === "id"
    );
    assert.ok(idProperty, "Поле id не найдено");
    assert.equal(idProperty.type, "number", "Поле id должно быть типа number");
  });

  it("Интерфейс содержит поле title типа string", function () {
    const titleProperty = reactInfo.types["Task"].properties.find(
      (prop) => prop.name === "title"
    );
    assert.ok(titleProperty, "Поле title не найдено");
    assert.equal(
      titleProperty.type,
      "string",
      "Поле title должно быть типа string"
    );
  });

  it("Интерфейс содержит поле completed типа boolean", function () {
    const completedProperty = reactInfo.types["Task"].properties.find(
      (prop) => prop.name === "completed"
    );
    assert.ok(completedProperty, "Поле completed не найдено");
    assert.equal(
      completedProperty.type,
      "boolean",
      "Поле completed должно быть типа boolean"
    );
  });
});

describe("Компонент TaskManager:", function () {
  it("Компонент TaskManager использует хук useState с типизацией для задач", function () {
    const component = reactInfo.components["TaskManager"];
    assert.ok(component, "Компонент TaskManager не найден");

    // Проверяем наличие хука useState с типизацией массива Task
    const hooks = component.hooks;
    const stateHooks = hooks.filter((hook) => hook.type === "state");

    assert.ok(
      stateHooks.length >= 2,
      "Компонент должен содержать как минимум два хука useState"
    );
  });

  it("Компонент TaskManager содержит правильную типизацию useState для массива Task", function () {
    const component = reactInfo.components["TaskManager"];
    const componentCode = component.code;

    // Проверяем наличие типизированного useState для tasks
    const hasTypedState =
      componentCode.includes("useState<Task[]>") ||
      componentCode.includes("useState<Array<Task>>") ||
      componentCode.includes("useState([] as Task[])") ||
      componentCode.includes("useState<readonly Task[]>") ||
      componentCode.includes("useState([] satisfies Task[])");

    assert.ok(
      hasTypedState,
      "useState для массива задач должен быть типизирован: useState<Task[]>([]) или аналогично"
    );
  });

  it("Компонент TaskManager содержит функцию добавления задачи", function () {
    const component = reactInfo.components["TaskManager"];
    const componentCode = component.code;

    // Проверяем определение функции addTask с типизацией
    assert.ok(componentCode.includes("addTask"), "Функция addTask не найдена");
    assert.ok(
      componentCode.includes("setTasks([...tasks, newTask])"),
      "Функция addTask должна добавлять новую задачу в массив tasks"
    );
  });

  it("Функция addTask типизирована корректно", function () {
    const component = reactInfo.components["TaskManager"];
    const componentCode = component.code;

    // Проверяем наличие типизации в функции addTask
    const hasTypedFunction =
      componentCode.includes("addTask = ():") ||
      componentCode.includes("addTask = () :") ||
      componentCode.includes("addTask = (): void") ||
      componentCode.includes("addTask: () =>") ||
      componentCode.includes("function addTask(): void");

    assert.ok(
      hasTypedFunction,
      "Функция addTask должна быть типизирована (например: addTask = (): void => {...})"
    );
  });

  it("Компонент TaskManager использует хук useEffect для логирования", function () {
    const component = reactInfo.components["TaskManager"];
    const hooks = component.hooks;

    // Проверяем наличие хука useEffect
    const effectHooks = hooks.filter((hook) => hook.type === "effect");
    assert.ok(
      effectHooks.length > 0,
      "Компонент должен содержать хук useEffect"
    );

    // Проверяем код компонента на наличие логирования
    const componentCode = component.code;
    assert.ok(
      componentCode.includes("console.log") &&
        componentCode.includes("Число задач"),
      "useEffect должен содержать вывод в консоль числа задач"
    );
  });

  it("useEffect имеет корректную типизацию зависимостей", function () {
    const component = reactInfo.components["TaskManager"];
    const componentCode = component.code;

    // Проверяем, что useEffect использует tasks в массиве зависимостей
    const hasEffectWithDeps =
      componentCode.includes("useEffect(() => {") &&
      (componentCode.includes("}, [tasks])") ||
        componentCode.includes("}, [tasks.length])"));

    assert.ok(
      hasEffectWithDeps,
      "useEffect должен принимать массив зависимостей с tasks или tasks.length"
    );
  });
});
