const { parseTypeScript } = require("../../src");
const path = require("path");

// Тестируем парсинг простого файла с декораторами
console.log("=== Тестирование парсинга декораторов ===");

const filePaths = [path.join(__dirname, "app.ts")];
const result = parseTypeScript(filePaths);

console.log("Найденные классы:");
console.log(JSON.stringify(result.classes, null, 2));

console.log("\nПроверяем класс UserService:");
if (result.classes.UserService) {
  console.log("UserService найден!");
  if (result.classes.UserService.decorators) {
    console.log(
      "Декораторы класса UserService:",
      result.classes.UserService.decorators
    );
  } else {
    console.log("❌ Декораторы класса UserService НЕ найдены");
  }

  // Проверяем методы
  console.log("\nМетоды UserService:");
  Object.keys(result.classes.UserService).forEach((key) => {
    if (
      typeof result.classes.UserService[key] === "object" &&
      result.classes.UserService[key].types &&
      result.classes.UserService[key].types.includes("function")
    ) {
      console.log(`Метод ${key}:`, result.classes.UserService[key]);
    }
  });
} else {
  console.log("❌ Класс UserService НЕ найден");
}
