const { parseTypeScript } = require("../../src");
const assert = require("assert");
const path = require("path");

const allVariables = parseTypeScript([path.join(__dirname, "main.ts")]);

console.log("Parsed enums:", JSON.stringify(allVariables.enums, null, 2));
console.log(
  "Parsed variables:",
  JSON.stringify(allVariables.variables, null, 2)
);

describe("Обычные enum:", function () {
  it("Color enum должен быть обычным (не const)", function () {
    assert.ok(allVariables.enums["Color"]);
    assert.strictEqual(allVariables.enums["Color"].isConst, false);
  });

  it("Color enum должен содержать правильные значения", function () {
    const colorEnum = allVariables.enums["Color"];
    assert.ok(
      colorEnum.members.some((m) => m.name === "Red" && m.value === '"red"')
    );
    assert.ok(
      colorEnum.members.some((m) => m.name === "Green" && m.value === '"green"')
    );
    assert.ok(
      colorEnum.members.some((m) => m.name === "Blue" && m.value === '"blue"')
    );
  });

  it("Status enum должен быть обычным (не const)", function () {
    assert.ok(allVariables.enums["Status"]);
    assert.strictEqual(allVariables.enums["Status"].isConst, false);
  });

  it("Status enum должен содержать числовые значения", function () {
    const statusEnum = allVariables.enums["Status"];
    assert.ok(
      statusEnum.members.some((m) => m.name === "Pending" && m.value === 0)
    );
    assert.ok(
      statusEnum.members.some((m) => m.name === "Approved" && m.value === 1)
    );
    assert.ok(
      statusEnum.members.some((m) => m.name === "Rejected" && m.value === 2)
    );
  });
});

describe("Константные enum:", function () {
  it("Direction enum должен быть константным", function () {
    assert.ok(allVariables.enums["Direction"]);
    assert.strictEqual(allVariables.enums["Direction"].isConst, true);
  });

  it("Direction enum должен содержать правильные значения", function () {
    const directionEnum = allVariables.enums["Direction"];
    assert.ok(
      directionEnum.members.some((m) => m.name === "Up" && m.value === '"UP"')
    );
    assert.ok(
      directionEnum.members.some(
        (m) => m.name === "Down" && m.value === '"DOWN"'
      )
    );
    assert.ok(
      directionEnum.members.some(
        (m) => m.name === "Left" && m.value === '"LEFT"'
      )
    );
    assert.ok(
      directionEnum.members.some(
        (m) => m.name === "Right" && m.value === '"RIGHT"'
      )
    );
  });

  it("Priority enum должен быть константным", function () {
    assert.ok(allVariables.enums["Priority"]);
    assert.strictEqual(allVariables.enums["Priority"].isConst, true);
  });

  it("Priority enum должен содержать правильные числовые значения", function () {
    const priorityEnum = allVariables.enums["Priority"];
    assert.ok(
      priorityEnum.members.some((m) => m.name === "Low" && m.value === 1)
    );
    assert.ok(
      priorityEnum.members.some((m) => m.name === "Medium" && m.value === 2)
    );
    assert.ok(
      priorityEnum.members.some((m) => m.name === "High" && m.value === 3)
    );
  });
});

describe("Экспортируемые enum:", function () {
  it("Theme enum должен быть экспортируемым и обычным", function () {
    assert.ok(allVariables.enums["Theme"]);
    assert.strictEqual(allVariables.enums["Theme"].isConst, false);
    assert.strictEqual(allVariables.enums["Theme"].isExported, true);
  });

  it("Size enum должен быть экспортируемым и константным", function () {
    assert.ok(allVariables.enums["Size"]);
    assert.strictEqual(allVariables.enums["Size"].isConst, true);
    assert.strictEqual(allVariables.enums["Size"].isExported, true);
  });
});

describe("Переменные с enum типами:", function () {
  it("userColor должна иметь тип Color", function () {
    assert.ok(allVariables.variables["userColor"]);
    assert.ok(allVariables.variables["userColor"]["types"].includes("Color"));
  });

  it("moveDirection должна иметь тип Direction", function () {
    assert.ok(allVariables.variables["moveDirection"]);
    assert.ok(
      allVariables.variables["moveDirection"]["types"].includes("Direction")
    );
  });

  it("currentStatus должна иметь тип Status", function () {
    assert.ok(allVariables.variables["currentStatus"]);
    assert.ok(
      allVariables.variables["currentStatus"]["types"].includes("Status")
    );
  });

  it("taskPriority должна иметь тип Priority", function () {
    assert.ok(allVariables.variables["taskPriority"]);
    assert.ok(
      allVariables.variables["taskPriority"]["types"].includes("Priority")
    );
  });
});
