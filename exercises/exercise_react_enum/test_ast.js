const { parseReact } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseReact([path.join(__dirname, "main.tsx")]);

console.log("Parsed enums:", JSON.stringify(allVariables.enums, null, 2));
console.log(
  "Parsed variables:",
  JSON.stringify(allVariables.variables, null, 2)
);
console.log(
  "Parsed functions:",
  JSON.stringify(allVariables.functions, null, 2)
);

describe("Обычные enum в React:", function () {
  it("LoadingState enum должен быть обычным (не const)", function () {
    assert.ok(allVariables.enums["LoadingState"]);
    assert.strictEqual(allVariables.enums["LoadingState"].isConst, false);
  });

  it("LoadingState enum должен содержать правильные значения", function () {
    const loadingEnum = allVariables.enums["LoadingState"];
    assert.ok(
      loadingEnum.members.some((m) => m.name === "Idle" && m.value === '"idle"')
    );
    assert.ok(
      loadingEnum.members.some(
        (m) => m.name === "Loading" && m.value === '"loading"'
      )
    );
    assert.ok(
      loadingEnum.members.some(
        (m) => m.name === "Success" && m.value === '"success"'
      )
    );
    assert.ok(
      loadingEnum.members.some(
        (m) => m.name === "Error" && m.value === '"error"'
      )
    );
  });

  it("Priority enum должен быть обычным (не const)", function () {
    assert.ok(allVariables.enums["Priority"]);
    assert.strictEqual(allVariables.enums["Priority"].isConst, false);
  });

  it("Priority enum должен содержать числовые значения", function () {
    const priorityEnum = allVariables.enums["Priority"];
    assert.ok(
      priorityEnum.members.some((m) => m.name === "Low" && m.value === 0)
    );
    assert.ok(
      priorityEnum.members.some((m) => m.name === "Medium" && m.value === 1)
    );
    assert.ok(
      priorityEnum.members.some((m) => m.name === "High" && m.value === 2)
    );
  });
});

describe("Константные enum в React:", function () {
  it("ButtonSize enum должен быть константным", function () {
    assert.ok(allVariables.enums["ButtonSize"]);
    assert.strictEqual(allVariables.enums["ButtonSize"].isConst, true);
  });

  it("ButtonSize enum должен содержать правильные значения", function () {
    const buttonSizeEnum = allVariables.enums["ButtonSize"];
    assert.ok(
      buttonSizeEnum.members.some(
        (m) => m.name === "Small" && m.value === '"sm"'
      )
    );
    assert.ok(
      buttonSizeEnum.members.some(
        (m) => m.name === "Medium" && m.value === '"md"'
      )
    );
    assert.ok(
      buttonSizeEnum.members.some(
        (m) => m.name === "Large" && m.value === '"lg"'
      )
    );
  });

  it("LogLevel enum должен быть константным", function () {
    assert.ok(allVariables.enums["LogLevel"]);
    assert.strictEqual(allVariables.enums["LogLevel"].isConst, true);
  });

  it("LogLevel enum должен содержать правильные числовые значения", function () {
    const logLevelEnum = allVariables.enums["LogLevel"];
    assert.ok(
      logLevelEnum.members.some((m) => m.name === "Debug" && m.value === 0)
    );
    assert.ok(
      logLevelEnum.members.some((m) => m.name === "Info" && m.value === 1)
    );
    assert.ok(
      logLevelEnum.members.some((m) => m.name === "Warning" && m.value === 2)
    );
    assert.ok(
      logLevelEnum.members.some((m) => m.name === "Error" && m.value === 3)
    );
  });
});

describe("Экспортируемые enum в React:", function () {
  it("Theme enum должен быть экспортируемым и обычным", function () {
    assert.ok(allVariables.enums["Theme"]);
    assert.strictEqual(allVariables.enums["Theme"].isConst, false);
    assert.strictEqual(allVariables.enums["Theme"].isExported, true);
  });

  it("ComponentType enum должен быть экспортируемым и константным", function () {
    assert.ok(allVariables.enums["ComponentType"]);
    assert.strictEqual(allVariables.enums["ComponentType"].isConst, true);
    assert.strictEqual(allVariables.enums["ComponentType"].isExported, true);
  });
});

describe("React компонент с enum:", function () {
  it("Button компонент должен быть определен", function () {
    assert.ok(allVariables.functions["Button"]);
    assert.strictEqual(allVariables.functions["Button"].jsx, true);
  });

  it("Button компонент должен иметь правильные параметры", function () {
    const buttonComponent = allVariables.functions["Button"];
    assert.ok(buttonComponent.params);
    assert.ok(buttonComponent.params.length > 0);
  });
});

describe("Переменные с enum типами в React:", function () {
  it("currentTheme должна иметь тип Theme", function () {
    assert.ok(allVariables.variables["currentTheme"]);
    assert.ok(
      allVariables.variables["currentTheme"]["types"].includes("Theme")
    );
  });

  it("componentType должна иметь тип ComponentType", function () {
    assert.ok(allVariables.variables["componentType"]);
    assert.ok(
      allVariables.variables["componentType"]["types"].includes("ComponentType")
    );
  });

  it("appState должна иметь тип LoadingState", function () {
    assert.ok(allVariables.variables["appState"]);
    assert.ok(
      allVariables.variables["appState"]["types"].includes("LoadingState")
    );
  });

  it("taskPriority должна иметь тип Priority", function () {
    assert.ok(allVariables.variables["taskPriority"]);
    assert.ok(
      allVariables.variables["taskPriority"]["types"].includes("Priority")
    );
  });
});
