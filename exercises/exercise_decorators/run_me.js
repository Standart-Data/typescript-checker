const { runMochaTests, showTestResults } = require("../../runMocha.js");
const path = require("path");

// Запускаем тесты, указывая абсолютный путь к файлу теста
const testPath = path.join(__dirname, "test_ast.js");
runMochaTests(testPath).then((results) => {
  showTestResults(results);
});
